import traverse from 'traverse';

import { MessageObject } from './LLMFetcher';
import { LLMJsonProcessor } from './LLMJsonProcessor';
import { getObjectPatch } from './utils/json';

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
		(source: Record<any, any>, transformed: Record<any, any>) => {
			const missedPaths = traverse(getObjectPatch(source, transformed).superset)
				.paths()
				.slice(1)
				.map((path) => path.join('.'));
			const addedPaths = traverse(getObjectPatch(transformed, source).superset)
				.paths()
				.slice(1)
				.map((path) => path.join('.'));

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
		private readonly prompts: {
			translate: (json: string, from: string, to: string) => string;
			fix?: InvalidTranslationPromptFetcher;
		},
	) {}

	public async translate<T extends {}>(sourceObject: T, from: string, to: string) {
		const validator = createValidator({
			fix: this.prompts.fix,
			context: {
				json: structuredClone(sourceObject),
				from,
				to,
			},
		});

		return this.jsonProcessor.process(sourceObject, {
			prompt: (json) => this.prompts.translate(json, from, to),
			validate: validator,
			validateSlice: validator,
		});
	}
}
