import { LLMJsonProcessor } from './LLMJsonProcessor';
import { isEqualStructures } from './utils/json';

export class LLMJsonTranslator {
	constructor(
		private readonly jsonProcessor: LLMJsonProcessor,
		private readonly getPrompt: (json: string, from: string, to: string) => string,
	) {}

	public async translate<T extends {}>(sourceObject: T, from: string, to: string) {
		return this.jsonProcessor.process(sourceObject, {
			prompt: (json) => this.getPrompt(json, from, to),
			validate: (a: unknown, b: unknown) => {
				const isEqual = isEqualStructures(a, b);

				if (!isEqual) throw new Error('Not equal structures');

				return true;
			},
			validateSlice: (a: unknown, b: unknown) => {
				const isEqual = isEqualStructures(a, b);

				if (!isEqual) throw new Error('Not equal structures');

				return true;
			},
		});
	}
}
