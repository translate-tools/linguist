import { isEqualStructures, sliceJsonString } from './utils/json';

export interface LLMFetcher {
	/**
	 * Method for request to AI model
	 */
	fetch(prompt: string): Promise<string>;

	/**
	 * Max length of string for prompt
	 */
	getLengthLimit(): number;

	/**
	 * Delay between requests to comply with the requests-per-minute limit.
	 */
	getRequestsTimeout(): number;
}

export class LLMTranslator {
	constructor(
		private readonly fetcher: LLMFetcher,
		private readonly getPrompt: (json: string, from: string, to: string) => string,
	) {}

	public async translate<T extends {}>(sourceObject: T, from: string, to: string) {
		const objectSlices = sliceJsonString(
			JSON.stringify(sourceObject),
			this.fetcher.getLengthLimit(),
		);

		// Translate slices
		const translatedSlices: [string, unknown][] = [];
		for (const slice of objectSlices) {
			for (let retry = 0; true; retry++) {
				try {
					const translatedSlice = await this.fetcher.fetch(
						this.getPrompt(slice, from, to),
					);
					const sourceObject = JSON.parse(slice);
					const translatedObject = JSON.parse(translatedSlice);

					if (!isEqualStructures(sourceObject, translatedObject))
						throw new TypeError('Not equal structures');

					translatedSlices.push(...Object.entries(translatedObject));
					break;
				} catch (error) {
					if (retry++ < 3) continue;

					throw error;
				}
			}
		}

		const translatedObject = Object.fromEntries(translatedSlices);
		if (!isEqualStructures(sourceObject, translatedObject))
			throw new TypeError(
				'Not equal structures between source object and result object',
			);

		return translatedObject;
	}
}
