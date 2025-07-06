import { LLMFetcher } from './LLMFetcher';
import { sliceJsonString } from './utils/json';

/**
 * LLM processor for JSON objects that support object slicing
 *
 * JSON object will be split to chunks that will be processed one by one
 */
export class LLMJsonProcessor {
	constructor(
		private readonly fetcher: LLMFetcher,
		private readonly config: {
			concurrency?: number;
			termsLimit?: number;
			chunkParsingRetriesLimit?: number;
		} = {},
	) {}

	public async process<T extends {}>(
		sourceObject: T,
		{
			prompt,
			validate,
			validateSlice,
		}: {
			prompt: (json: string) => string;
			validate?: (sourceObject: any, processedObject: any) => boolean;
			validateSlice?: (sourceObject: any, processedObject: any) => boolean;
		},
	) {
		const objectSlices = sliceJsonString(
			JSON.stringify(sourceObject),
			this.fetcher.getLengthLimit(),
			this.config.termsLimit ?? 6,
		);

		const transformedSlices: [string, unknown][][] = Array(objectSlices.length);

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
								const transformedSlice = await this.fetcher.fetch(
									prompt(slice),
								);
								const sourceObject = JSON.parse(slice);
								const transformedObject = JSON.parse(transformedSlice);

								if (
									validateSlice &&
									!validateSlice(sourceObject, transformedObject)
								) {
									throw new TypeError('Invalid slice');
								}

								transformedSlices[currentIndex] =
									Object.entries(transformedObject);
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

		const transformedObject = Object.fromEntries(transformedSlices.flat());
		if (validate && !validate(sourceObject, transformedObject))
			throw new TypeError('Invalid result object');

		return transformedObject;
	}
}
