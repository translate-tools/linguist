import { getAllTabs } from '../../lib/browser/tabs';
import { sendTabRequest } from '../../requests/utils';

// Requests
import { getPageLanguageFactory } from '../../requests/contentscript/getPageLanguage';
import { getPageTranslateStateFactory } from '../../requests/contentscript/pageTranslation/getPageTranslateState';
import { pingFactory } from '../../requests/contentscript/ping';
import { enableTranslatePageFactory } from '../../requests/contentscript/pageTranslation/enableTranslatePage';
import { disableTranslatePageFactory } from '../../requests/contentscript/pageTranslation/disableTranslatePage';
import { translateSelectedTextFactory } from '../../requests/contentscript/translateSelectedText';

import { ClientConfig } from './ClientConfig';
import { PageTranslationContext } from './PageTranslationContext';

// TODO: use builder for this request to ensure types integrity
// Firstly, we should refactor builder to make it more abstract

// TODO: move to common requests
/**
 * Send update event to all tabs
 */
export const sendConfigUpdateEvent = () =>
	getAllTabs().then((tabs) =>
		tabs.forEach((tab) =>
			sendTabRequest(tab.id, 'configUpdated')
				// Ignore errors
				.catch(() => {}),
		),
	);

export class ContentScript {
	public static async main() {
		const config = new ClientConfig();
		const contentscript = new ContentScript(config);

		await contentscript.start();
	}

	private config: ClientConfig;
	constructor(config: ClientConfig) {
		this.config = config;
	}

	private pageTranslationContext: PageTranslationContext | null = null;
	public async start() {
		// Skip for already started instances
		if (this.pageTranslationContext !== null) return;

		const $config = await this.config.getStore();

		const pageTranslationContext = new PageTranslationContext($config);
		this.pageTranslationContext = pageTranslationContext;

		await pageTranslationContext.start();

		const factories = [
			pingFactory,
			getPageTranslateStateFactory,
			getPageLanguageFactory,
			enableTranslatePageFactory,
			disableTranslatePageFactory,
			translateSelectedTextFactory,
		];

		factories.forEach((factory) => {
			factory({
				$config,
				pageContext: pageTranslationContext,
			});
		});
	}
}
