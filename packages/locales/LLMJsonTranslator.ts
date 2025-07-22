import { MessageObject } from './LLMFetcher';
import { LLMJsonProcessor, ProcessingHooks, ValidatorResult } from './LLMJsonProcessor';
import { getObjectPaths, getObjectsDiff } from './utils/json';

export type TranslationContext = {
	json: Record<string, any>;
	from: string;
	to: string;
};

export type InvalidTranslationPromptFetcher = (data: {
	missedPaths: string[];
	addedPaths: string[];
	context: TranslationContext;
}) => MessageObject[];

export const createValidator =
	({
		fix,
		context,
	}: {
		context: TranslationContext;
		fix?: InvalidTranslationPromptFetcher;
	}) =>
	(source: Record<any, any>, transformed: Record<any, any>): ValidatorResult => {
		const missedPaths = getObjectPaths(
			getObjectsDiff(transformed, source, 'diff', Boolean),
		);
		const addedPaths = getObjectPaths(
			getObjectsDiff(source, transformed, 'diff', Boolean),
		);

		if (missedPaths.length === 0 && addedPaths.length === 0) return { isValid: true };

		return {
			isValid: false,
			reason: new Error('Not equal structures'),
			correctionRequest: fix
				? fix({
						missedPaths,
						addedPaths,
						context: structuredClone(context),
					})
				: undefined,
		};
	};

export class LLMJsonTranslator {
	constructor(
		private readonly jsonProcessor: LLMJsonProcessor,
		private readonly options: {
			translate: (json: string, from: string, to: string) => string;
			fix?: InvalidTranslationPromptFetcher;
		} & ProcessingHooks,
	) {}

	public async translate<T extends {}>(sourceObject: T, from: string, to: string) {
		const validator = createValidator({
			fix: this.options.fix,
			context: {
				json: structuredClone(sourceObject),
				from,
				to,
			},
		});

		return this.jsonProcessor.process(sourceObject, {
			prompt: (json) => this.options.translate(json, from, to),
			onProcessed: this.options.onProcessed,
			onParsingError: this.options.onParsingError,
			onError: this.options.onError,
			validate: validator,
			validateSlice: validator,
		});
	}
}
