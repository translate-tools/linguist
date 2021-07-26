import { TypeOf } from 'io-ts';
import { StringType, type } from '../lib/types';
import {
	langCode,
	langCodes,
	langCodeWithAuto,
} from '@translate-tools/core/types/Translator';

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

export const LangCode = new type.Type<langCode, langCode, unknown>(
	'LangCode',
	(input: unknown): input is langCode =>
		typeof input === 'string' && langCodes.findIndex((i) => i === input) > -1,
	(input, context) =>
		typeof input === 'string' && langCodes.findIndex((i) => i === input) > -1
			? type.success(input as langCode)
			: type.failure(input, context),
	type.identity,
);

export const LangCodeWithAuto = new type.Type<
	langCodeWithAuto,
	langCodeWithAuto,
	unknown
>(
	'LangCodeWithAuto',
	(input: unknown): input is langCodeWithAuto =>
		input === 'auto' ||
		(typeof input === 'string' && langCodes.findIndex((i) => i === input) > -1),
	(input, context) =>
		input === 'auto' ||
		(typeof input === 'string' && langCodes.findIndex((i) => i === input) > -1)
			? type.success(input as langCodeWithAuto)
			: type.failure(input, context),
	type.identity,
);

export const AppConfig = type.type({
	language: type.string,
	translatorModule: type.string,
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
		zIndex: type.union([type.number, type.undefined]),
		focusOnTranslateButton: type.union([type.boolean, type.undefined]),
		rememberDirection: type.boolean,
		quickTranslate: type.boolean,
		modifers: type.array(
			type.union([
				StringType('ctrlKey'),
				StringType('altKey'),
				StringType('shiftKey'),
				StringType('metaKey'),
			]),
		),
		strictSelection: type.boolean,
		detectedLangFirst: type.boolean,
		timeoutForHideButton: type.number,
	}),
	pageTranslator: type.type({
		ignoredTags: ArrayOfStrings,
		translatableAttributes: ArrayOfStrings,
		lazyTranslate: type.boolean,
	}),
	textTranslator: type.type({
		rememberText: type.boolean,
		spellCheck: type.boolean,
	}),
	contentscript: type.type({
		selectTranslator: type.type({
			enabled: type.boolean,
			disableWhileTranslatePage: type.boolean,
		}),
	}),
	popup: type.type({
		rememberLastTab: type.boolean,
	}),
	popupTab: type.type({
		pageTranslator: type.type({
			showCounters: type.boolean,
		}),
	}),
});

export type AppConfigType = TypeOf<typeof AppConfig>;
