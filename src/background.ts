import { getMigrationsInfo, updateMigrationsInfoItem } from './migrations/migrations';

import { sendRequestToAllCS } from './lib/communication';
import { getUserLanguage } from './lib/language';
import { ConfigStorage } from './modules/ConfigStorage/ConfigStorage';

import {
	Background,
	isValidNativeTranslatorModuleName,
	translatorModules,
} from './modules/Background';
import { AppConfig, AppConfigType } from './types/runtime';
import { clearLastTranslation as clearTextTranslatorState } from './layouts/TextTranslator/TextTranslator@tab';

// Request handlers
import { updateConfigFactory } from './requests/backend/updateConfig';
import { pingFactory } from './requests/backend/ping';
import { translateFactory } from './requests/backend/translate';
import { getTranslatorFeaturesFactory } from './requests/backend/getTranslatorFeatures';
import { getLanguagePreferencesFactory } from './requests/backend/getLanguagePreferences';
import { getTranslatorModulesFactory } from './requests/backend/getTranslatorModules';
import { getConfigFactory } from './requests/backend/getConfig';
import { setConfigFactory } from './requests/backend/setConfig';
import { resetConfigFactory } from './requests/backend/resetConfig';
import { clearCacheFactory } from './requests/backend/clearCache';
import { setSitePreferencesFactory } from './requests/backend/autoTranslation/sitePreferences/setSitePreferences';
import { getSitePreferencesFactory } from './requests/backend/autoTranslation/sitePreferences/getSitePreferences';

import { addTranslationFactory } from './requests/backend/translations/addTranslation';
import { findTranslationFactory } from './requests/backend/translations/findTranslation';
import { deleteTranslationFactory } from './requests/backend/translations/deleteTranslation';
import { getTranslationsFactory } from './requests/backend/translations/getTranslations';
import { clearTranslationsFactory } from './requests/backend/translations/clearTranslations';
import { hasAutoTranslatedLangFactory } from './requests/backend/autoTranslation/autoTranslatedLangs/hasAutoTranslatedLang';
import { addAutoTranslatedLangFactory } from './requests/backend/autoTranslation/autoTranslatedLangs/addAutoTranslatedLang';
import { deleteAutoTranslatedLangFactory } from './requests/backend/autoTranslation/autoTranslatedLangs/deleteAutoTranslatedLang';
import { migrateAll } from './migrations/migrationsList';

// Debug
// TODO: write tests for translators in core dir
if (process.env.NODE_ENV !== 'production') {
	console.warn('Welcome to background debug');

	const isTestTranslateModules = false;
	if (isTestTranslateModules) {
		(Object.keys(translatorModules) as (keyof typeof translatorModules)[]).forEach(
			(name) => {
				const displayName = `DBG [${name}]`;

				const translatorClass = translatorModules[name];

				console.warn(`${displayName}: class`, translatorClass);

				const tr = new translatorClass();

				const knob = (text = 'Hello world') =>
					tr
						.translate(text, 'en', 'es')
						.then((result) =>
							console.info(
								`${displayName}: translate "${text}" as ${result}`,
							),
						);

				console.warn(`${displayName}: knob`, knob);
				knob();
			},
		);
	}
}

// Migrate data
(async () => {
	// Init migrations data
	await updateMigrationsInfoItem({});

	// Run migrations
	await migrateAll();
})();

// Init config

export const defaultConfig: AppConfigType = {
	translatorModule: 'GoogleTranslator',
	language: getUserLanguage(),
	scheduler: {
		useCache: true,
		translateRetryAttemptLimit: 2,
		isAllowDirectTranslateBadChunks: true,
		directTranslateLength: null,
		translatePoolDelay: 300,
		chunkSizeForInstantTranslate: null,
	},
	cache: {
		ignoreCase: true,
	},
	pageTranslator: {
		ignoredTags: [
			'meta',
			'link',
			'script',
			'noscript',
			'style',
			'code',
			'pre',
			'textarea',
		],
		translatableAttributes: ['title', 'alt', 'placeholder', 'label', 'aria-label'],
		lazyTranslate: true,
		detectLanguageByContent: true,
	},
	textTranslator: {
		rememberText: true,
		spellCheck: true,
	},
	selectTranslator: {
		zIndex: 999999,
		rememberDirection: false,
		quickTranslate: false,
		modifiers: [],
		strictSelection: false,
		detectedLangFirst: true,
		timeoutForHideButton: 3000,
		focusOnTranslateButton: false,
		showOnceForSelection: true,
		showOriginalText: true,
		isUseAutoForDetectLang: true,
	},
	contentscript: {
		selectTranslator: {
			enabled: true,
			disableWhileTranslatePage: true,
		},
	},
	popup: {
		rememberLastTab: true,
	},
	popupTab: {
		pageTranslator: {
			showCounters: true,
		},
	},
};

// TODO: use async `storage.local` instead `localStorage`
const cfg = new ConfigStorage(AppConfig.props, defaultConfig);

// Fix config
const initTranslatorModule = cfg.getConfig('translatorModule');
if (
	initTranslatorModule === null ||
	!isValidNativeTranslatorModuleName(initTranslatorModule)
) {
	cfg.set({ translatorModule: defaultConfig.translatorModule });
}

// TODO: remove it after september 2021
// Migration for previous data
Object.keys(defaultConfig).forEach((key) => {
	// Try write data if possible
	const rawValue = localStorage.getItem(key);
	if (rawValue !== null) {
		const value = JSON.parse(rawValue);
		cfg.set({ [key]: value });
	}

	// Remove from `localStorage`
	localStorage.removeItem(key);
});

// Init BG

const bg = new Background(cfg);

cfg.subscribe((newProps, oldProps) => {
	// Clear cache while disableing
	if (
		newProps.scheduler !== undefined &&
		newProps.scheduler.useCache === false &&
		oldProps.scheduler?.useCache === true
	) {
		bg.clearTranslatorsCache();
	}

	// Clear TextTranslator state
	if (
		newProps.textTranslator !== undefined &&
		newProps.textTranslator.rememberText === false &&
		oldProps.textTranslator?.rememberText === true
	) {
		clearTextTranslatorState();
	}

	sendRequestToAllCS('configUpdated');
});

// Set handlers from factories

const factories = [
	pingFactory,
	translateFactory,
	getTranslatorFeaturesFactory,
	getLanguagePreferencesFactory,
	getTranslatorModulesFactory,
	clearCacheFactory,

	getConfigFactory,
	setConfigFactory,
	resetConfigFactory,
	updateConfigFactory,

	hasAutoTranslatedLangFactory,
	addAutoTranslatedLangFactory,
	deleteAutoTranslatedLangFactory,
	setSitePreferencesFactory,
	getSitePreferencesFactory,

	addTranslationFactory,
	deleteTranslationFactory,
	findTranslationFactory,
	getTranslationsFactory,
	clearTranslationsFactory,
];

// Prevent run it again on other pages, such as options page
// NOTE: on options page function `resetConfigFactory` is undefined. How it work?
const backgroundPagePath = '/_generated_background_page.html';
if (location.pathname === backgroundPagePath) {
	factories.forEach((factory) => {
		factory({ cfg, bg, translatorModules });
	});
}
