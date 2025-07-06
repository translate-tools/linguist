import { LLMFetcher } from './LLMFetcher';
import { isEqualStructures, sliceJsonString } from './utils/json';

export class LLMTranslator {
	constructor(
		private readonly fetcher: LLMFetcher,
		private readonly getPrompt: (json: string, from: string, to: string) => string,
		private readonly config: {
			concurrency?: number;
			termsLimit?: number;
			chunkParsingRetriesLimit?: number;
		} = {},
	) {}

	public async translate<T extends {}>(sourceObject: T, from: string, to: string) {
		const objectSlices = sliceJsonString(
			JSON.stringify(sourceObject),
			this.fetcher.getLengthLimit(),
			this.config.termsLimit ?? 6,
		);

		// Translate slices
		const translatedSlices: [string, unknown][][] = Array(objectSlices.length);

		let index = 0;
		const abort = new AbortController();
		await Promise.all(
			Array(this.config.concurrency ?? 3)
				.fill(null)
				.map(async () => {
					while (true) {
						if (abort.signal.aborted) return;

						const currentIndex = index++;
						const slice = objectSlices[currentIndex];

						// End of worker
						if (!slice) return;

						for (let retry = 0; true; retry++) {
							if (abort.signal.aborted) return;

							try {
								const translatedSlice = await this.fetcher.fetch(
									this.getPrompt(slice, from, to),
								);
								const sourceObject = JSON.parse(slice);
								const translatedObject = JSON.parse(translatedSlice);

								if (!isEqualStructures(sourceObject, translatedObject)) {
									throw new TypeError('Not equal structures');
								}

								translatedSlices[currentIndex] =
									Object.entries(translatedObject);
								break;
							} catch (error) {
								if (retry++ < (this.config.chunkParsingRetriesLimit ?? 5))
									continue;

								throw error;
							}
						}
					}
				}),
		).catch((error) => {
			abort.abort(error);
			throw error;
		});

		const translatedObject = Object.fromEntries(translatedSlices.flat());
		if (!isEqualStructures(sourceObject, translatedObject))
			throw new TypeError(
				'Not equal structures between source object and result object',
			);

		return translatedObject;
	}
}
