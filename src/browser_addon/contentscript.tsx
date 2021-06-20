import { isEqual } from 'lodash';
import { getPageLanguageFromMeta } from './lib/browser';
import { detectLanguage } from './lib/language';

import { ContentScript } from './modules/ContentScript';
import { PageTranslator } from './modules/PageTranslator/PageTranslator';
import { SelectTranslator } from './modules/SelectTranslator';

// Requests
import { getAutoTranslatedLangs } from './requests/backend/autoTranslatedLangs/getAutoTranslatedLangs';
import { getSitePreferences } from './requests/backend/sitePreferences/getSitePreferences';
import { getPageLanguageFactory } from './requests/contentscript/getPageLanguage';
import { getTranslateStateFactory } from './requests/contentscript/getTranslateState';
import { pingFactory } from './requests/contentscript/ping';
import { translatePageFactory } from './requests/contentscript/translatePage';
import { untranslatePageFactory } from './requests/contentscript/untranslatePage';

const cs = new ContentScript();

cs.onLoad(async (initConfig) => {
	const pageLanguage =
		getPageLanguageFromMeta() ??
		(await detectLanguage(document.body.innerText)) ??
		undefined;

	// Set last config after await
	let config = cs.getConfig() ?? initConfig;

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

	cs.onUpdate((newConfig) => {
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
	});

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

	// Auto translate page
	const fromLang = pageLanguage;
	const toLang = config.language;
	const sitePrefs = await getSitePreferences(location.host);
	const autoTranslatedLangs = await getAutoTranslatedLangs();
	if (!pageTranslator.isRun() && fromLang && fromLang !== toLang) {
		let isNeedAutoTranslate = false;

		// Auto translate by host
		if (sitePrefs?.translateAlways) {
			isNeedAutoTranslate = true;
		}

		// Auto translate by language
		if (autoTranslatedLangs.indexOf(fromLang) !== -1) {
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
	}
});
