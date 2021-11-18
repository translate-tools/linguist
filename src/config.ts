import { isSmartphone } from './lib/browser';
import { getUserLanguage } from './lib/language';
import { AppConfigType } from './types/runtime';

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
		// Temporary solution to fix UX due to bug https://github.com/translate-tools/linguist/issues/75
		lazyTranslate: isSmartphone() ? false : true,
		detectLanguageByContent: true,
		originalTextPopup: false,
	},
	textTranslator: {
		rememberText: true,
		spellCheck: true,
		suggestLanguage: true,
		suggestLanguageAlways: true,
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