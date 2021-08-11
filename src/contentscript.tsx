import { isEqual } from 'lodash';
import { runByReadyState } from 'react-elegant-ui/esm/lib/runByReadyState';

import { AppConfigType } from './types/runtime';
import { getPageLanguage } from './lib/browser';

import { ContentScript } from './modules/ContentScript';
import { PageTranslator } from './modules/PageTranslator/PageTranslator';
import { SelectTranslator } from './modules/SelectTranslator';

import { getTranslatePreferencesForSite } from './layouts/PageTranslator/PageTranslator@tab';

// Requests
import { getSitePreferences } from './requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { getPageLanguageFactory } from './requests/contentscript/getPageLanguage';
import { getTranslateStateFactory } from './requests/contentscript/getTranslateState';
import { pingFactory } from './requests/contentscript/ping';
import { translatePageFactory } from './requests/contentscript/translatePage';
import { untranslatePageFactory } from './requests/contentscript/untranslatePage';
import { getLanguagePreferences } from './requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';

const cs = new ContentScript();

cs.onLoad(async (initConfig) => {
	// Set last config after await
	let config = cs.getConfig() ?? initConfig;

	const pageLanguage = await getPageLanguage(
		config.pageTranslator.detectLanguageByContent,
	);

	const pageTranslator = new PageTranslator(config.pageTranslator);

	let selectTranslator: SelectTranslator | null = null;

	const selectTranslatorRef: { value: SelectTranslator | null } = {
		value: selectTranslator,
	};

	const updateSelectTranslatorRef = () =>
		(selectTranslatorRef.value = selectTranslator);

	if (config.contentscript.selectTranslator.enabled) {
		selectTranslator = new SelectTranslator({
			...config.selectTranslator,
			pageLanguage,
		});
		selectTranslator.start();
		updateSelectTranslatorRef();
	}

	const updateConfig = (newConfig: AppConfigType) => {
		// Update global config
		if (!isEqual(config.contentscript, newConfig.contentscript)) {
			// Make or delete SelectTranslator
			if (newConfig.contentscript.selectTranslator.enabled) {
				if (selectTranslator === null) {
					selectTranslator = new SelectTranslator({
						...newConfig.selectTranslator,
						pageLanguage,
					});
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

			// Start/stop of SelectTranslator
			const isNeedRunSelectTranslator =
				newConfig.contentscript.selectTranslator.enabled &&
				(!newConfig.contentscript.selectTranslator.disableWhileTranslatePage ||
					!pageTranslator.isRun());

			if (isNeedRunSelectTranslator) {
				if (selectTranslator !== null && !selectTranslator.isRun()) {
					selectTranslator.start();
				}
			} else {
				if (selectTranslator !== null && selectTranslator.isRun()) {
					selectTranslator.stop();
				}
			}
		}

		// Update SelectTranslator
		if (!isEqual(config.selectTranslator, newConfig.selectTranslator)) {
			if (
				newConfig.contentscript.selectTranslator.enabled &&
				selectTranslator !== null
			) {
				if (selectTranslator.isRun()) {
					selectTranslator.stop();
					selectTranslator = new SelectTranslator({
						...newConfig.selectTranslator,
						pageLanguage,
					});
					updateSelectTranslatorRef();

					selectTranslator.start();
				} else {
					selectTranslator = new SelectTranslator({
						...newConfig.selectTranslator,
						pageLanguage,
					});
					updateSelectTranslatorRef();
				}
			}
		}

		// Update PageTranslator
		if (!isEqual(config.pageTranslator, newConfig.pageTranslator)) {
			if (pageTranslator.isRun()) {
				const direction = pageTranslator.getTranslateDirection();
				if (direction === null) {
					throw new TypeError(
						'Invalid response from getTranslateDirection method',
					);
				}
				pageTranslator.stop();
				pageTranslator.updateConfig(newConfig.pageTranslator);
				pageTranslator.run(direction.from, direction.to);
			} else {
				pageTranslator.updateConfig(newConfig.pageTranslator);
			}
		}

		// Update local config
		config = newConfig;
	};

	cs.onUpdate(updateConfig);

	const factories = [
		pingFactory,
		getTranslateStateFactory,
		getPageLanguageFactory,
		translatePageFactory,
		untranslatePageFactory,
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

		const actualPageLanguage = await getPageLanguage(
			config.pageTranslator.detectLanguageByContent,
		);

		// Update config if language did updated after loading page
		if (pageLanguage !== actualPageLanguage) {
			updateConfig(config);
		}

		// Auto translate page
		const fromLang = actualPageLanguage;
		const toLang = config.language;
		const sitePrefs = await getSitePreferences(pageHost);

		// Skip by common causes
		if (fromLang === undefined) return;
		if (fromLang === toLang && !isAllowTranslateSameLanguages) return;

		const translateState = getTranslatePreferencesForSite(fromLang, sitePrefs);

		console.warn({ translateState });

		// Skip by site preferences
		if (translateState === 'never' || translateState === 'neverForThisLang') return;

		let isNeedAutoTranslate = false;

		// Translate by site preferences
		if (translateState === 'always' || translateState === 'alwaysForThisLang') {
			isNeedAutoTranslate = true;
		}

		// Consider common language preferences
		const langPrefs = await getLanguagePreferences(fromLang);
		if (langPrefs !== null) {
			// Never translate this language
			if (!langPrefs) return;

			// Otherwise translate
			isNeedAutoTranslate = true;
		}

		if (isNeedAutoTranslate) {
			const selectTranslator = selectTranslatorRef.value;

			if (
				selectTranslator !== null &&
				selectTranslator.isRun() &&
				config.contentscript.selectTranslator.disableWhileTranslatePage
			) {
				selectTranslator.stop();
			}

			pageTranslator.run(fromLang, toLang);
		}
	}, 'interactive');
});
