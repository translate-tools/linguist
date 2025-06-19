import { ClientConfig } from './ClientConfig';
import { PageTranslationContext } from './PageTranslationContext';
import { requestHandlers } from './requestHandlers';

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
		requestHandlers.forEach((factory) => {
			factory({ $config, pageTranslationContext });
		});
	}
}
