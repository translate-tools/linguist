import { combine, createEffect, createEvent, createStore, sample, Store } from 'effector';

import { onHotkeysPressed } from '../../components/controls/Hotkey/utils';
import { getPageLanguage } from '../../lib/browser';
import { isNotEqual } from '../../lib/effector/filters';
import { isRequireTranslateBySitePreferences } from '../../pages/popup/tabs/PageTranslator/PageTranslator.utils/utils';
import { getLanguagePreferences } from '../../requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
// Requests
import { getSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { getTranslatorFeatures } from '../../requests/backend/getTranslatorFeatures';
import { AppConfigType } from '../../types/runtime';

import { PageTranslatorController } from './PageTranslator/PageTranslatorController';
import { PageTranslatorManager } from './PageTranslator/PageTranslatorManager';
import { SelectTranslatorController } from './SelectTranslator/SelectTranslatorController';
import { SelectTranslatorManager } from './SelectTranslator/SelectTranslatorManager';

export type PageTranslationOptions = {
	from: string;
	to: string;
};

export type PageData = {
	language: string | null;
};

type TranslatorsState = {
	pageTranslation: PageTranslationOptions | null;
	textTranslation: boolean;
};

export class PageTranslationContext {
	private readonly events = {
		updatePageTranslationState: createEvent<PageTranslationOptions | null>(),
	};

	private $config: Store<AppConfigType>;

	/**
	 * Collected data about page
	 */
	private $pageData: Store<PageData>;

	/**
	 * The translators state source of truth
	 */
	private $translatorsState: Store<TranslatorsState>;

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
			{ updateFilter: isNotEqual },
		);

		// Subscribe on events
		this.$translatorsState.on(
			this.events.updatePageTranslationState,
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
	}

	private controllers: {
		pageTranslator: PageTranslatorController | null;
		selectTranslator: SelectTranslatorController | null;
	} = {
			pageTranslator: null,
			selectTranslator: null,
		};

	public getDOMTranslator() {
		return this.controllers.pageTranslator;
	}

	public getTextTranslator() {
		return this.controllers.selectTranslator;
	}

	public async start() {
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

		const selectTranslatorManager = new SelectTranslatorManager(
			$selectTranslatorState,
		);
		selectTranslatorManager.start();

		this.controllers.selectTranslator = new SelectTranslatorController(
			selectTranslatorManager,
		);

		// Init page translator
		const $pageTranslatorState = $masterStore.map(({ config, translatorsState }) => ({
			state: translatorsState.pageTranslation,
			config: config.pageTranslator,
		}));

		const pageTranslatorManager = new PageTranslatorManager($pageTranslatorState);
		pageTranslatorManager.start();

		this.controllers.pageTranslator = new PageTranslatorController(
			pageTranslatorManager,
			this.events.updatePageTranslationState,
		);

		// Watch ready state
		const $docReadyState = createStore(document.readyState);
		const updatedDocReadyState = createEvent<DocumentReadyState>();
		$docReadyState.on(updatedDocReadyState, (_, state) => state);

		document.addEventListener('readystatechange', () => {
			updatedDocReadyState(document.readyState);
		});

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
		}).watch(this.initTranslation);

		// Setup hotkeys
		let hotkeysObserverCleanup: (() => void) | null = null;
		$masterStore
			.map(({ config, pageData, translatorsState }) => ({
				hotkeys: config.pageTranslator.toggleTranslationHotkey,
				userLanguage: config.language,
				pageLanguage: pageData.language,
				isPageTranslated: translatorsState.pageTranslation !== null,
			}))
			.watch(({ hotkeys, pageLanguage, userLanguage, isPageTranslated }) => {
				// Reset current observer
				if (hotkeysObserverCleanup) {
					hotkeysObserverCleanup();
					hotkeysObserverCleanup = null;
				}

				if (hotkeys) {
					hotkeysObserverCleanup = onHotkeysPressed(hotkeys, (e) => {
						e.preventDefault();
						// Toggle translation
						if (isPageTranslated) {
							this.events.updatePageTranslationState(null);
						} else {
							if (pageLanguage === null) {
								throw new Error('Page language not set');
							}

							this.events.updatePageTranslationState({
								from: pageLanguage,
								to: userLanguage,
							});
						}
					});
				}
			});
	}

	private initTranslation = async ({
		config,
		translatorsState,
		pageData,
	}: {
		config: AppConfigType;
		translatorsState: TranslatorsState;
		pageData: PageData;
	}) => {
		// Skip if page already in translating
		if (translatorsState.pageTranslation !== null) return;

		// TODO: make it option
		const isAllowTranslateSameLanguages = true;

		const pageLanguage = pageData.language;
		const userLanguage = config.language;

		// Skip by language directions
		if (pageLanguage === null) return;
		if (pageLanguage === userLanguage && !isAllowTranslateSameLanguages) return;

		let isNeedAutoTranslate = false;

		// Consider site preferences
		const pageHost = location.host;
		const sitePreferences = await getSitePreferences(pageHost);
		const isSiteRequireTranslate = isRequireTranslateBySitePreferences(
			pageLanguage,
			sitePreferences,
		);
		if (isSiteRequireTranslate !== null) {
			// Never translate this site
			if (!isSiteRequireTranslate) return;

			// Otherwise translate
			isNeedAutoTranslate = true;
		}

		// Consider common language preferences
		const isLanguageRequireTranslate = await getLanguagePreferences(pageLanguage);
		if (isLanguageRequireTranslate !== null) {
			// Never translate this language
			if (!isLanguageRequireTranslate) return;

			// Otherwise translate
			isNeedAutoTranslate = true;
		}

		if (isNeedAutoTranslate) {
			const { supportedLanguages } = await getTranslatorFeatures();
			const isLanguagesSupportedByTranslator = [pageLanguage, userLanguage].every(
				(language) => supportedLanguages.includes(language),
			);

			if (isLanguagesSupportedByTranslator) {
				this.events.updatePageTranslationState({
					from: pageLanguage,
					to: userLanguage,
				});
			}
		}
	};
}
