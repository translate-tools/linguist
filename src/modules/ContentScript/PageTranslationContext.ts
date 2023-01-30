import { combine, createEvent, createStore, Store, sample, createEffect } from 'effector';

import { AppConfigType } from '../../types/runtime';
import { getPageLanguage } from '../../lib/browser';
import { updateNotEqualFilter } from '../../lib/effector/filters';

// Requests
import { getSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { getLanguagePreferences } from '../../requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
import { isRequireTranslateBySitePreferences } from '../../layouts/PageTranslator/PageTranslator.utils/utils';

import { PageTranslator } from '../PageTranslator/PageTranslator';
import {
	Options as SelectTranslatorOptions,
	SelectTranslator,
} from '../SelectTranslator';

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

type PageTranslationOptions = {
	from: string;
	to: string;
};

type TranslatorsState = {
	pageTranslation: PageTranslationOptions | null;
	textTranslation: boolean;
};

// TODO: move to a file
class SelectTranslatorManager {
	private $state;
	constructor(
		$state: Store<{
			enabled: boolean;
			config: AppConfigType['selectTranslator'];
			pageData: PageData;
		}>,
	) {
		this.$state = $state;
	}

	private selectTranslator: SelectTranslator | null = null;

	public getSelectTranslator() {
		return this.selectTranslator;
	}

	public start() {
		// Manage text translation instance
		this.$state.watch(({ config: preferences, pageData }) => {
			console.warn('TT prefs', preferences);

			if (preferences.enabled) {
				const pageLanguage = pageData.language || undefined;
				const config = buildSelectTranslatorOptions(preferences, {
					pageLanguage,
				});

				if (this.selectTranslator === null) {
					this.selectTranslator = new SelectTranslator(config);
				} else {
					const isRun = this.selectTranslator.isRun();
					if (isRun) {
						this.selectTranslator.stop();
					}

					this.selectTranslator = new SelectTranslator(config);

					if (isRun) {
						this.selectTranslator.start();
					}
				}
			} else {
				if (this.selectTranslator === null) return;

				if (this.selectTranslator.isRun()) {
					this.selectTranslator.stop();
				}

				this.selectTranslator = null;
			}
		});

		// Manage text translation state
		const $isTextTranslationStarted = this.$state.map(({ enabled }) => enabled);
		$isTextTranslationStarted.watch((isTranslating) => {
			console.warn('TT state', isTranslating);

			if (this.selectTranslator === null) return;
			if (isTranslating === this.selectTranslator.isRun()) return;

			if (isTranslating) {
				this.selectTranslator.start();
			} else {
				this.selectTranslator.stop();
			}
		});
	}
}

// TODO: move to a file
class PageTranslatorManager {
	private $state;
	private pageTranslator: PageTranslator;

	constructor(
		$state: Store<{
			state: PageTranslationOptions | null;
			config: AppConfigType['pageTranslator'];
		}>,
	) {
		this.$state = $state;

		// Create instances for translation
		const currentState = $state.getState();
		this.pageTranslator = new PageTranslator(currentState.config);
	}

	public getDomTranslator() {
		return this.pageTranslator;
	}

	public start() {
		// Manage page translation instance
		this.$state.watch(({ config }) => {
			if (!this.pageTranslator.isRun()) {
				this.pageTranslator.updateConfig(config);
				return;
			}

			const direction = this.pageTranslator.getTranslateDirection();
			if (direction === null) {
				throw new TypeError('Invalid response from getTranslateDirection method');
			}

			this.pageTranslator.stop();
			this.pageTranslator.updateConfig(config);
			this.pageTranslator.run(direction.from, direction.to);
		});

		// Manage page translation state
		this.$state.watch(({ state: pageTranslation }) => {
			const shouldTranslate = pageTranslation !== null;
			if (shouldTranslate === this.pageTranslator.isRun()) return;

			if (pageTranslation !== null) {
				this.pageTranslator.run(pageTranslation.from, pageTranslation.to);
			} else {
				this.pageTranslator.stop();
			}
		});
	}
}

export class PageTranslationContext {
	private $config: Store<AppConfigType>;

	/**
	 * The translators state source of truth
	 */
	private $translatorsState: Store<TranslatorsState>;
	private $pageData: Store<PageData>;

	constructor($config: Store<AppConfigType>) {
		this.$config = $config;
		this.$pageData = createStore<PageData>({
			language: null,
		});
		this.$translatorsState = createStore<TranslatorsState>(
			{
				pageTranslation: null,
				textTranslation: false,
			},
			{ updateFilter: updateNotEqualFilter },
		);
	}

	private pageTranslator: PageTranslatorManager | null = null;
	public getDOMTranslator() {
		// TODO: remove guard
		if (this.pageTranslator === null) {
			throw new Error('Page translator is not created yet');
		}

		return this.pageTranslator.getDomTranslator();
	}

	private selectTranslator: SelectTranslatorManager | null = null;
	public getTextTranslator() {
		return this.selectTranslator?.getSelectTranslator() ?? null;
	}

	// TODO: move events to another place
	private readonly pageDataControl = {
		updatedPageTranslationState: createEvent<PageTranslationOptions | null>(),
	};

	// TODO: encapsulate knobs instead of direct access
	public getTranslationKnobs() {
		return this.pageDataControl;
	}

	// TODO: split the code
	// TODO: test the code
	public async start() {
		// Subscribe on events
		this.$translatorsState.on(
			this.pageDataControl.updatedPageTranslationState,
			(state, pageTranslation) => ({ ...state, pageTranslation }),
		);

		// Update text translator state
		const textTranslatorStateChanged = createEvent<boolean>();
		this.$translatorsState.on(
			textTranslatorStateChanged,
			(state, textTranslation) => ({ ...state, textTranslation }),
		);

		const $isTextTranslatorForceDisabled = createStore(false);
		sample({
			source: {
				config: this.$config,
				translatorsState: this.$translatorsState,
			},
			fn({ config, translatorsState }) {
				if (translatorsState.pageTranslation === null) return false;

				return config.selectTranslator.disableWhileTranslatePage;
			},
			target: $isTextTranslatorForceDisabled,
		});

		combine({
			config: this.$config,
			isTextTranslatorForceDisabled: $isTextTranslatorForceDisabled,
		})
			.map(({ config, isTextTranslatorForceDisabled }) => {
				return config.selectTranslator.enabled && !isTextTranslatorForceDisabled;
			})
			.watch(textTranslatorStateChanged);

		// TODO: use specific storages instead of common store
		const $masterStore = combine({
			config: this.$config,
			translatorsState: this.$translatorsState,
			pageData: this.$pageData,
		});

		// Init text translator
		const $selectTranslatorState = $masterStore.map(
			({ config, translatorsState, pageData }) => ({
				enabled: translatorsState.textTranslation,
				config: config.selectTranslator,
				pageData,
			}),
		);

		this.selectTranslator = new SelectTranslatorManager($selectTranslatorState);
		this.selectTranslator.start();

		// Init page translator
		const $pageTranslatorState = $masterStore.map(({ config, translatorsState }) => ({
			state: translatorsState.pageTranslation,
			config: config.pageTranslator,
		}));

		this.pageTranslator = new PageTranslatorManager($pageTranslatorState);
		this.pageTranslator.start();

		const updatedDocReadyState = createEvent<DocumentReadyState>();
		document.addEventListener('readystatechange', () => {
			updatedDocReadyState(document.readyState);
		});

		const $docReadyState = createStore(document.readyState);
		$docReadyState.on(updatedDocReadyState, (_, state) => state);

		// TODO: add option to define stage to detect language and run auto translate
		// Init page translate
		const $isPageLoaded = $docReadyState.map((readyState) => {
			const getReadyStateIndex = (state: DocumentReadyState) =>
				['loading', 'interactive', 'complete'].indexOf(state);

			return getReadyStateIndex(readyState) >= getReadyStateIndex('interactive');
		});

		// Scan page to collect data
		const scanPageFx = createEffect(async (config: AppConfigType) => {
			const pageLanguage = await getPageLanguage(
				config.pageTranslator.detectLanguageByContent,
			);

			return { pageLanguage };
		});

		this.$pageData.on(scanPageFx.doneData, (state, payload) => ({
			...state,
			language: payload.pageLanguage,
		}));

		sample({
			clock: $isPageLoaded,
			source: this.$config,
		}).watch(scanPageFx);

		// Init auto translate page
		sample({
			clock: scanPageFx.doneData,
			source: $masterStore,
		}).watch(async ({ config, translatorsState, pageData }) => {
			// Auto translate page
			const fromLang = pageData.language;
			const toLang = config.language;

			// Skip if page already in translating
			if (translatorsState.pageTranslation !== null) return;

			// TODO: make it option
			const isAllowTranslateSameLanguages = true;

			// Skip by language directions
			if (fromLang === null) return;
			if (fromLang === toLang && !isAllowTranslateSameLanguages) return;

			let isNeedAutoTranslate = false;

			// Consider site preferences
			const pageHost = location.host;
			const sitePreferences = await getSitePreferences(pageHost);
			const isSiteRequireTranslate = isRequireTranslateBySitePreferences(
				fromLang,
				sitePreferences,
			);
			if (isSiteRequireTranslate !== null) {
				// Never translate this site
				if (!isSiteRequireTranslate) return;

				// Otherwise translate
				isNeedAutoTranslate = true;
			}

			// Consider common language preferences
			const isLanguageRequireTranslate = await getLanguagePreferences(fromLang);
			if (isLanguageRequireTranslate !== null) {
				// Never translate this language
				if (!isLanguageRequireTranslate) return;

				// Otherwise translate
				isNeedAutoTranslate = true;
			}

			if (isNeedAutoTranslate) {
				this.pageDataControl.updatedPageTranslationState({
					from: fromLang,
					to: toLang,
				});
			}
		});
	}
}
