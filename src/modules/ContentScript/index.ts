import { getPageLanguage } from '../../lib/browser';
import { getAllTabs } from '../../lib/browser/tabs';
import { createSelector } from '../../lib/effector/createSelector';
import { updateNotEqualFilter } from '../../lib/effector/filters';

import { sendTabRequest } from '../../requests/utils';
import { AppConfigType } from '../../types/runtime';
import { PageTranslator } from '../PageTranslator/PageTranslator';
import {
	Options as SelectTranslatorOptions,
	SelectTranslator,
} from '../SelectTranslator';

import { ClientConfig } from './ClientConfig';

// Requests
import { getSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { getPageLanguageFactory } from '../../requests/contentscript/getPageLanguage';
import { getPageTranslateStateFactory } from '../../requests/contentscript/pageTranslation/getPageTranslateState';
import { pingFactory } from '../../requests/contentscript/ping';
import { enableTranslatePageFactory } from '../../requests/contentscript/pageTranslation/enableTranslatePage';
import { disableTranslatePageFactory } from '../../requests/contentscript/pageTranslation/disableTranslatePage';
import { getLanguagePreferences } from '../../requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
import { translateSelectedTextFactory } from '../../requests/contentscript/translateSelectedText';
import { runByReadyState } from 'react-elegant-ui/esm/lib/runByReadyState';
import { isRequireTranslateBySitePreferences } from '../../layouts/PageTranslator/PageTranslator.utils/utils';
import { createEvent, createStore, Store } from 'effector';

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

const buildSelectTranslatorOptions = (
	{ mode, ...options }: AppConfigType['selectTranslator'],
	{ pageLanguage }: { pageLanguage?: string },
): SelectTranslatorOptions => ({
	...options,
	pageLanguage,
	quickTranslate: mode === 'quickTranslate',
	enableTranslateFromContextMenu: mode === 'contextMenu',
});

type PageData = {
	language: string | null;
};

// TODO: introduce new class with contentscript context like `getDOMTranslator` (to not provide methods like `start`)
// TODO: eliminate `getState` calls
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

	private pageTranslator: PageTranslator | null = null;
	// TODO: ensure it never return null if it may be avoided
	public getDOMTranslator() {
		return this.pageTranslator;
	}

	private selectTranslator: SelectTranslator | null = null;
	public getTextTranslator() {
		return this.selectTranslator;
	}

	private pageData: Store<PageData> | null = null;
	private readonly pageDataControl = {
		updatedLanguage: createEvent<string>(),
	} as const;

	public async start() {
		const $config = await this.config.getStore();
		const config = $config.getState();

		// Create instances for translation
		this.pageTranslator = new PageTranslator(config.pageTranslator);

		// Collect page data
		const pageLanguage = await getPageLanguage(
			config.pageTranslator.detectLanguageByContent,
		);

		const $pageData = createStore({
			language: pageLanguage,
		});

		$pageData.on(this.pageDataControl.updatedLanguage, (state, language) => ({
			...state,
			language,
		}));

		this.pageData = $pageData;

		await this.startTranslation();

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
				pageContext: this,
			});
		});
	}

	private async startTranslation() {
		const $config = await this.config.getStore();

		const $selectTranslator = createSelector(
			$config,
			(state) => state.selectTranslator,
			{
				updateFilter: updateNotEqualFilter,
			},
		);

		// Make or delete SelectTranslator
		// We re-create instance to make able a disable select translator
		// to avoid appending unnecessary nodes to DOM
		$selectTranslator.watch((config) => {
			if (config.enabled) {
				if (this.selectTranslator === null) {
					const pageLanguage = this.pageData?.getState().language || undefined;
					this.selectTranslator = new SelectTranslator(
						buildSelectTranslatorOptions(config, {
							pageLanguage,
						}),
					);
				}
			} else {
				if (this.selectTranslator !== null) {
					if (this.selectTranslator.isRun()) {
						this.selectTranslator.stop();
					}
					this.selectTranslator = null;
				}
			}
		});

		// Start/stop of SelectTranslator
		$config
			.map(({ selectTranslator }) => {
				return (
					selectTranslator.enabled &&
					(!selectTranslator.disableWhileTranslatePage ||
						this.pageTranslator === null ||
						!this.pageTranslator.isRun())
				);
			})
			.watch((isNeedRunSelectTranslator) => {
				// TODO: depend on change this state reactively
				if (this.selectTranslator === null) return;

				if (isNeedRunSelectTranslator) {
					if (!this.selectTranslator.isRun()) {
						this.selectTranslator.start();
					}
				} else if (this.selectTranslator.isRun()) {
					this.selectTranslator.stop();
				}
			});

		// Update SelectTranslator
		$selectTranslator.watch((config) => {
			if (this.selectTranslator === null || !config.enabled) return;

			const isRunning = this.selectTranslator.isRun();

			// Stop current instance
			if (isRunning) {
				this.selectTranslator.stop();
			}

			const pageLanguage = this.pageData?.getState().language || undefined;
			this.selectTranslator = new SelectTranslator(
				buildSelectTranslatorOptions(config, {
					pageLanguage,
				}),
			);

			// Run new instance
			if (isRunning) {
				this.selectTranslator.start();
			}
		});

		// Update PageTranslator
		createSelector($config, (state) => state.pageTranslator, {
			updateFilter: updateNotEqualFilter,
		}).watch((config) => {
			if (this.pageTranslator === null) return;

			if (this.pageTranslator.isRun()) {
				const direction = this.pageTranslator.getTranslateDirection();
				if (direction === null) {
					throw new TypeError(
						'Invalid response from getTranslateDirection method',
					);
				}
				this.pageTranslator.stop();
				this.pageTranslator.updateConfig(config);
				this.pageTranslator.run(direction.from, direction.to);
			} else {
				this.pageTranslator.updateConfig(config);
			}
		});

		// Init page translate
		// TODO: add option to define stage to detect language and run auto translate
		runByReadyState(this.onPageLoaded, 'interactive');
	}

	private onPageLoaded = async () => {
		const pageHost = location.host;

		// TODO: make it option
		const isAllowTranslateSameLanguages = true;

		const $config = await this.config.getStore();
		const config = $config.getState();

		// Skip if page already in translating
		if (this.pageTranslator && this.pageTranslator.isRun()) return;

		const actualPageLanguage = await getPageLanguage(
			config.pageTranslator.detectLanguageByContent,
		);

		// TODO: make it reactive
		// Update config if language did updated after loading page
		const pageLanguage = this.pageData?.getState().language || undefined;
		if (pageLanguage !== actualPageLanguage && actualPageLanguage !== null) {
			// Update language state
			this.pageDataControl.updatedLanguage(actualPageLanguage);

			// Update config
			// state.update(config);
		}

		// Auto translate page
		const fromLang = actualPageLanguage;
		const toLang = config.language;

		// Skip by common causes
		if (fromLang === undefined) return;
		if (fromLang === toLang && !isAllowTranslateSameLanguages) return;

		let isNeedAutoTranslate = false;

		// Consider site preferences
		const sitePreferences = await getSitePreferences(pageHost);
		const isSiteRequireTranslate =
			fromLang !== null &&
			isRequireTranslateBySitePreferences(fromLang, sitePreferences);
		if (isSiteRequireTranslate !== null) {
			// Never translate this site
			if (!isSiteRequireTranslate) return;

			// Otherwise translate
			isNeedAutoTranslate = true;
		}

		if (fromLang !== null) {
			// Consider common language preferences

			const isLanguageRequireTranslate = await getLanguagePreferences(fromLang);
			if (isLanguageRequireTranslate !== null) {
				// Never translate this language
				if (!isLanguageRequireTranslate) return;

				// Otherwise translate
				isNeedAutoTranslate = true;
			}

			if (isNeedAutoTranslate) {
				const selectTranslator = this.selectTranslator;

				if (
					selectTranslator !== null &&
					selectTranslator.isRun() &&
					config.selectTranslator.disableWhileTranslatePage
				) {
					selectTranslator.stop();
				}

				if (this.pageTranslator) {
					this.pageTranslator.run(fromLang, toLang);
				}
			}
		}
	};
}
