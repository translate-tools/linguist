import deepmerge from 'deepmerge';

import { LLMFetcher, MessageObject } from './LLMFetcher';
import { sliceJsonString } from './utils/json';
import { ObjectFilter, splitObjectByFilter } from './utils/splitObjectByFilter';
import { waitTimeWithJitter } from './utils/time';

export type ParsingErrorFixer = (response: string) => MessageObject[];

export type ValidatorResult =
	| {
			isValid: true;
	  }
	| {
			isValid: false;
			reason?: unknown;
			correctionRequest?: MessageObject[];
	  };

export type ObjectTransformingValidator = (
	sourceObject: any,
	processedObject: any,
) => ValidatorResult;

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
			backpressureTimeout?: {
				base: number;
				max: number;
			} | null;
		} = {},
	) {}

	public async process<T extends {}>(
		sourceObject: T,
		{
			prompt,
			onParsingError,
			filter,
			validate,
			validateSlice,
		}: {
			prompt: (json: string) => string;
			onParsingError?: ParsingErrorFixer;
			filter?: ObjectFilter;
			validate?: ObjectTransformingValidator;
			validateSlice?: ObjectTransformingValidator;
		},
	) {
		const filteredObject = filter
			? splitObjectByFilter(sourceObject, filter)
			: { included: sourceObject, excluded: {} };

		const objectSlices = sliceJsonString(
			JSON.stringify(filteredObject.included),
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

						const messages: MessageObject[] = [
							{ role: 'user', content: prompt(slice) },
						];
						let correctionMessages: null | MessageObject[] = null;
						for (let retry = 0; true; retry++) {
							if (abort.signal.aborted) return;

							try {
								// Update request
								if (correctionMessages) {
									messages.push(...correctionMessages);
									correctionMessages = null;
								}

								const response = await this.fetcher.query(
									structuredClone(messages),
								);

								// Update messages
								messages.push(...response);

								const transformedSlice = messages.slice(-1)[0].content;
								if (!transformedSlice)
									throw new TypeError('Empty message in response');

								const sourceObject = JSON.parse(slice);
								let transformedObject;
								try {
									transformedObject = JSON.parse(transformedSlice);
								} catch (error) {
									if (onParsingError) {
										correctionMessages =
											onParsingError(transformedSlice);
									}
									throw error;
								}

								// Validate slice
								if (validateSlice) {
									const validationResult = validateSlice(
										sourceObject,
										transformedObject,
									);

									if (!validationResult.isValid) {
										// Correction messages
										if (validationResult.correctionRequest) {
											correctionMessages =
												validationResult.correctionRequest;
										}

										throw validationResult.reason
											? validationResult.reason
											: new TypeError('Invalid slice');
									}
								}

								transformedSlices[currentIndex] =
									Object.entries(transformedObject);
								break;
							} catch (error) {
								if (
									retry++ < (this.config.chunkParsingRetriesLimit ?? 5)
								) {
									if (this.config.backpressureTimeout !== null) {
										await waitTimeWithJitter({
											base: 100,
											max: 1000,

											// Override by user config
											...this.config.backpressureTimeout,

											retry,
										});
									}

									continue;
								}

								throw error;
							}
						}
					}
				}),
		).catch((error) => {
			abort.abort(error);
			throw error;
		});

		const transformedObject = deepmerge.all([
			Object.fromEntries(transformedSlices.flat()),
			filteredObject.excluded,
		]);

		// Validate result object
		if (validate) {
			const validationResult = validate(sourceObject, transformedObject);
			if (!validationResult.isValid)
				throw validationResult.reason ?? new TypeError('Invalid result object');
		}

		return transformedObject;
	}
}
