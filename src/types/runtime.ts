import { isLanguageCodeISO639v1 } from 'anylang/languages';
import { TypeOf } from 'io-ts';

import { StringLiteralType, type } from '../lib/types';

export const ArrayOfStrings = new type.Type<string[], string[], unknown>(
	'ArrayOfStrings',
	(input: unknown): input is string[] =>
		Array.isArray(input) && input.every((i) => typeof i === 'string'),
	(input, context) =>
		Array.isArray(input) && input.every((i) => typeof i === 'string')
			? type.success(input)
			: type.failure(input, context),
	type.identity,
);

export const LangCode = new type.Type<string, string, unknown>(
	'LangCode',
	(input: unknown): input is string =>
		typeof input === 'string' && isLanguageCodeISO639v1(input),
	(input, context) =>
		typeof input === 'string' && isLanguageCodeISO639v1(input)
			? type.success(input)
			: type.failure(input, context),
	type.identity,
);

export const LangCodeWithAuto = new type.Type<string, string, unknown>(
	'LangCodeWithAuto',
	(input: unknown): input is string =>
		input === 'auto' || (typeof input === 'string' && isLanguageCodeISO639v1(input)),
	(input, context) =>
		input === 'auto' || (typeof input === 'string' && isLanguageCodeISO639v1(input))
			? type.success(input)
			: type.failure(input, context),
	type.identity,
);

export const AppConfig = type.type({
	language: type.string,
	translatorModule: type.string,
	ttsModule: type.string,
	scheduler: type.type({
		useCache: type.boolean,
		translateRetryAttemptLimit: type.number,
		isAllowDirectTranslateBadChunks: type.boolean,
		directTranslateLength: type.union([type.number, type.null]),
		translatePoolDelay: type.number,
		chunkSizeForInstantTranslate: type.union([type.number, type.null]),
	}),
	cache: type.type({
		ignoreCase: type.boolean,
	}),
	selectTranslator: type.type({
		enabled: type.boolean,
		disableWhileTranslatePage: type.boolean,
		zIndex: type.union([type.number, type.undefined]),
		focusOnTranslateButton: type.union([type.boolean, type.undefined]),
		rememberDirection: type.boolean,
		modifiers: type.array(
			type.union([
				StringLiteralType('ctrlKey'),
				StringLiteralType('altKey'),
				StringLiteralType('shiftKey'),
				StringLiteralType('metaKey'),
			]),
		),
		strictSelection: type.boolean,
		detectedLangFirst: type.boolean,
		showOnceForSelection: type.boolean,
		showOriginalText: type.boolean,
		isUseAutoForDetectLang: type.boolean,
		timeoutForHideButton: type.number,
		mode: type.union([
			StringLiteralType('popupButton'),
			StringLiteralType('quickTranslate'),
			StringLiteralType('contextMenu'),
		]),
	}),
	pageTranslator: type.type({
		excludeSelectors: ArrayOfStrings,
		translatableAttributes: ArrayOfStrings,
		lazyTranslate: type.boolean,
		detectLanguageByContent: type.boolean,
		originalTextPopup: type.boolean,
		enableContextMenu: type.boolean,
		toggleTranslationHotkey: type.union([type.null, type.string]),
	}),
	textTranslator: type.type({
		rememberText: type.boolean,
		spellCheck: type.boolean,
		suggestLanguage: type.boolean,
		suggestLanguageAlways: type.boolean,
	}),
	popup: type.type({
		rememberLastTab: type.boolean,
	}),
	history: type.type({
		enabled: type.boolean,
	}),
	popupTab: type.type({
		pageTranslator: type.type({
			showCounters: type.boolean,
		}),
	}),
});

export type AppConfigType = TypeOf<typeof AppConfig>;
