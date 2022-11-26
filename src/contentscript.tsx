import { runByReadyState } from 'react-elegant-ui/esm/lib/runByReadyState';

import { AppConfigType } from './types/runtime';
import { getPageLanguage } from './lib/browser';
import { StateManager } from './lib/StateManager';

// TODO: move all contentscript modules to use augment class
import { ContentScript } from './modules/ContentScript';
import { PageTranslator } from './modules/PageTranslator/PageTranslator';
import {
	SelectTranslator,
	Options as SelectTranslatorOptions,
} from './modules/SelectTranslator';
// import { EmbeddedControlPanel } from './augments/EmbeddedControlPanel';

import { isRequireTranslateBySitePreferences } from './layouts/PageTranslator/PageTranslator.utils/utils';

// Requests
import { getSitePreferences } from './requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { getPageLanguageFactory } from './requests/contentscript/getPageLanguage';
import { getPageTranslateStateFactory } from './requests/contentscript/pageTranslation/getPageTranslateState';
import { pingFactory } from './requests/contentscript/ping';
import { enableTranslatePageFactory } from './requests/contentscript/pageTranslation/enableTranslatePage';
import { disableTranslatePageFactory } from './requests/contentscript/pageTranslation/disableTranslatePage';
import { getLanguagePreferences } from './requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
import { translateSelectedTextFactory } from './requests/contentscript/translateSelectedText';

const buildSelectTranslatorOptions = (
	{ mode, ...options }: AppConfigType['selectTranslator'],
	{ pageLanguage }: { pageLanguage?: string },
): SelectTranslatorOptions => ({
	...options,
	pageLanguage,
	quickTranslate: mode === 'quickTranslate',
	enableTranslateFromContextMenu: mode === 'contextMenu',
});

const cs = new ContentScript();

cs.onLoad(async (initConfig) => {
	// Set last config after await
	let config = cs.getConfig() ?? initConfig;

	// Define helper
	const detectPageLanguage = () =>
		getPageLanguage(config.pageTranslator.detectLanguageByContent).then((lang) =>
			lang === null ? undefined : lang,
		);

	let pageLanguage = await detectPageLanguage();

	const pageTranslator = new PageTranslator(config.pageTranslator);

	let selectTranslator: SelectTranslator | null = null;

	const selectTranslatorRef: { value: SelectTranslator | null } = {
		value: selectTranslator,
	};

	const updateSelectTranslatorRef = () =>
		(selectTranslatorRef.value = selectTranslator);

	const state = new StateManager<AppConfigType>();

	state.onUpdate((cfg) => {
		// Update global config
		config = cfg;

		// Make or delete SelectTranslator
		// We re-create instance to make able a disable select translator
		// to avoid appending unnecessary nodes to DOM
		state.useEffect(() => {
			if (cfg.selectTranslator.enabled) {
				if (selectTranslator === null) {
					selectTranslator = new SelectTranslator(
						buildSelectTranslatorOptions(cfg.selectTranslator, {
							pageLanguage,
						}),
					);
					updateSelectTranslatorRef();
				}
			} else {
				if (selectTranslator !== null) {
					if (selectTranslator.isRun()) {
						selectTranslator.stop();
					}
					selectTranslator = null;
					updateSelectTranslatorRef();
				}
			}
		}, [cfg.selectTranslator.enabled]);

		// Start/stop of SelectTranslator
		const isNeedRunSelectTranslator =
			cfg.selectTranslator.enabled &&
			(!cfg.selectTranslator.disableWhileTranslatePage || !pageTranslator.isRun());

		state.useEffect(() => {
			if (selectTranslator === null) return;

			if (isNeedRunSelectTranslator) {
				if (!selectTranslator.isRun()) {
					selectTranslator.start();
				}
			} else if (selectTranslator.isRun()) {
				selectTranslator.stop();
			}
		}, [isNeedRunSelectTranslator, selectTranslator]);

		// Update SelectTranslator
		state.useEffect(
			() => {
				if (selectTranslator === null || !cfg.selectTranslator.enabled) return;

				const isRunning = selectTranslator.isRun();

				// Stop current instance
				if (isRunning) {
					selectTranslator.stop();
				}

				selectTranslator = new SelectTranslator(
					buildSelectTranslatorOptions(cfg.selectTranslator, {
						pageLanguage,
					}),
				);

				updateSelectTranslatorRef();

				// Run new instance
				if (isRunning) {
					selectTranslator.start();
				}
			},
			[cfg.selectTranslator],
			{ deepEqual: true },
		);

		// Update PageTranslator
		state.useEffect(
			() => {
				if (pageTranslator.isRun()) {
					const direction = pageTranslator.getTranslateDirection();
					if (direction === null) {
						throw new TypeError(
							'Invalid response from getTranslateDirection method',
						);
					}
					pageTranslator.stop();
					pageTranslator.updateConfig(cfg.pageTranslator);
					pageTranslator.run(direction.from, direction.to);
				} else {
					pageTranslator.updateConfig(cfg.pageTranslator);
				}
			},
			[cfg.pageTranslator],
			{ deepEqual: true },
		);
	});

	cs.onUpdate((cfg) => state.update(cfg));
	state.update(config);

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
			pageTranslator,
			config,
			selectTranslatorRef,
		});
	});

	// Init page translate

	const pageHost = location.host;

	// TODO: make it option
	const isAllowTranslateSameLanguages = true;

	// TODO: add option to define stage to detect language and run auto translate
	runByReadyState(async () => {
		// Skip if page already in translating
		if (pageTranslator.isRun()) return;

		const actualPageLanguage = await detectPageLanguage();

		// Update config if language did updated after loading page
		if (pageLanguage !== actualPageLanguage && actualPageLanguage !== undefined) {
			// Update language state
			pageLanguage = actualPageLanguage;

			// Update config
			state.update(config);
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
			const selectTranslator = selectTranslatorRef.value;

			if (
				selectTranslator !== null &&
				selectTranslator.isRun() &&
				config.selectTranslator.disableWhileTranslatePage
			) {
				selectTranslator.stop();
			}

			pageTranslator.run(fromLang, toLang);
		}
	}, 'interactive');
});
