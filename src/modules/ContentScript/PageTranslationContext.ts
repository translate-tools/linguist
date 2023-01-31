import { combine, createEvent, createStore, Store, sample, createEffect } from 'effector';

import { AppConfigType } from '../../types/runtime';
import { getPageLanguage } from '../../lib/browser';
import { updateNotEqualFilter } from '../../lib/effector/filters';

// Requests
import { getSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { getLanguagePreferences } from '../../requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
import { isRequireTranslateBySitePreferences } from '../../layouts/PageTranslator/PageTranslator.utils/utils';

import { SelectTranslatorManager } from '../SelectTranslator/SelectTranslatorManager';
import { PageTranslatorManager } from '../PageTranslator/PageTranslatorManager';

export type PageData = {
	language: string | null;
};

export type PageTranslationOptions = {
	from: string;
	to: string;
};

type TranslatorsState = {
	pageTranslation: PageTranslationOptions | null;
	textTranslation: boolean;
};

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

	// TODO: test the code
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

		this.selectTranslator = new SelectTranslatorManager($selectTranslatorState);
		this.selectTranslator.start();

		// Init page translator
		const $pageTranslatorState = $masterStore.map(({ config, translatorsState }) => ({
			state: translatorsState.pageTranslation,
			config: config.pageTranslator,
		}));

		this.pageTranslator = new PageTranslatorManager($pageTranslatorState);
		this.pageTranslator.start();

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
		}).watch(async ({ config, translatorsState, pageData }) => {
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
				this.pageDataControl.updatedPageTranslationState({
					from: pageLanguage,
					to: userLanguage,
				});
			}
		});
	}
}
