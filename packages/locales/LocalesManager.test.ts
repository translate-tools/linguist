import isEqual from 'deep-equal';

import { configureFakeLLMQuery, fakeTranslationPrompt } from './__tests__/llmFetcher';
import { LLMFetcher } from './LLMFetcher';
import { LLMJsonProcessor } from './LLMJsonProcessor';
import { LLMJsonTranslator } from './LLMJsonTranslator';
import { LocalesManager } from './LocalesManager';

const fetch = vi.fn();

const translationPrompt = (json: string, from: string, to: string) =>
	fakeTranslationPrompt(`translation request[${from}-${to}]` + json);

beforeEach(() => {
	vi.clearAllMocks();

	fetch.mockRestore();
	fetch.mockImplementation(
		configureFakeLLMQuery((json) => {
			const match = json.match(/^(translation request\[(\w+)-(\w+)\])/);
			return match
				? json
					.slice(match[0].length)
					.replaceAll(
						/:"(.+?)"/g,
						`:"translated[${match[2]}-${match[3]}] $1"`,
					)
				: json;
		}),
	);
});

const translator = new LLMJsonTranslator(
	new LLMJsonProcessor({
		query: fetch,
		getLengthLimit() {
			return 3000;
		},
		getRequestsTimeout() {
			return 0;
		},
	} satisfies LLMFetcher),
	{
		translate: translationPrompt,
	},
);

const localesManager = new LocalesManager(translator);

test('Translate flat structure', async () => {
	await expect(
		localesManager.sync({
			target: {
				language: 'lang1',
				content: {
					key1: 'lang1 - value1',
				},
			},
			source: {
				language: 'lang2',
				content: {
					key1: 'lang2 - value1',
					key2: 'lang2 - value2',
					key3: 'lang2 - value3',
				},
			},
		}),
	).resolves.toStrictEqual({
		key1: 'lang1 - value1',
		key2: 'translated[lang2-lang1] lang2 - value2',
		key3: 'translated[lang2-lang1] lang2 - value3',
	});
});

test("Sync call is translates new keys from `source` object, but don't touch not changed keys", async () => {
	await expect(
		localesManager.sync({
			target: {
				language: 'lang1',
				content: {
					key1: {
						message: 'lang1 - value1',
					},
				},
			},
			source: {
				language: 'lang2',
				content: {
					key1: { message: 'lang2 - value1' },
					key2: { message: 'lang2 - value2' },
					key3: { message: 'lang2 - value3' },
				},
			},
		}),
	).resolves.toStrictEqual({
		key1: { message: 'lang1 - value1' },
		key2: { message: 'translated[lang2-lang1] lang2 - value2' },
		key3: { message: 'translated[lang2-lang1] lang2 - value3' },
	});
});

test('Sync call is translates new keys from `source` object and force update keys that has been changed recently in source object', async () => {
	await expect(
		localesManager.sync({
			target: {
				language: 'lang1',
				content: {
					key1: {
						message: 'lang1 - value1',
					},
				},
			},
			source: {
				language: 'lang2',
				content: {
					key1: { message: 'lang2 - value1' },
					key2: { message: 'lang2 - value2' },
					key3: { message: 'lang2 - value3' },
				},
				previous: {
					key1: { message: 'lang2 - old value1' },
					key2: { message: 'lang2 - old value2' },
					key3: { message: 'lang2 - value3' },
				},
			},
		}),
	).resolves.toStrictEqual({
		key1: { message: 'translated[lang2-lang1] lang2 - value1' },
		key2: { message: 'translated[lang2-lang1] lang2 - value2' },
		key3: { message: 'translated[lang2-lang1] lang2 - value3' },
	});
});

describe('Skip nodes', () => {
	test('Sync call is translates new keys from `source` object and ignore nodes marked by `skip` filter', async () => {
		await expect(
			localesManager.sync({
				target: {
					language: 'lang1',
					content: {
						key1: {
							message: 'lang1 - value1',
						},
						nestedObject: {
							foo: {
								message: 'lang1 - text',
							},
							bar: {
								message: 'lang1 - text',
								baz: {
									message: 'lang1 - text',
								},
							},
							partiallyTranslated: {
								forTranslation: {
									message: 'lang1 - text',
								},
								notForTranslation: {
									message: 'lang1 - text',
								},
							},
						},
						additionalKey1: {
							message: 'lang1 - additionalKey1',
						},
						additionalKey2: {
							message: 'lang1 - additionalKey1',
						},
						additionalKey3: {
							message: 'lang1 - additionalKey1',
						},
					},
				},
				source: {
					language: 'lang2',
					content: {
						key1: { message: 'lang2 - value1' },
						key2: { message: 'lang2 - value2' },
						key3: { message: 'lang2 - value3' },
						nestedObject: {
							foo: {
								message: 'lang2 - text',
							},
							bar: {
								message: 'lang2 - text',
								baz: {
									message: 'lang2 - text',
								},
							},
							partiallyTranslated: {
								forTranslation: {
									message: 'lang2 - text',
								},
								notForTranslation: {
									message: 'lang2 - text',
								},
							},
						},
					},
					previous: {
						key1: { message: 'lang2 - old value1' },
						key2: { message: 'lang2 - old value2' },
						key3: { message: 'lang2 - value3' },
					},
				},
				skip(context) {
					if (context.path[0].startsWith('additionalKey')) return true;

					const ignoredPaths = [
						['key1'],
						['nestedObject', 'foo'],
						['nestedObject', 'partiallyTranslated', 'notForTranslation'],
					];
					return ignoredPaths.some((path) => isEqual(context.path, path));
				},
			}),
		).resolves.toStrictEqual({
			key1: { message: 'lang1 - value1' },
			key2: { message: 'translated[lang2-lang1] lang2 - value2' },
			key3: { message: 'translated[lang2-lang1] lang2 - value3' },
			nestedObject: {
				foo: {
					message: 'lang1 - text',
				},
				bar: {
					message: 'translated[lang2-lang1] lang2 - text',
					baz: {
						message: 'translated[lang2-lang1] lang2 - text',
					},
				},
				partiallyTranslated: {
					forTranslation: {
						message: 'translated[lang2-lang1] lang2 - text',
					},
					notForTranslation: {
						message: 'lang1 - text',
					},
				},
			},
			additionalKey1: {
				message: 'lang1 - additionalKey1',
			},
			additionalKey2: {
				message: 'lang1 - additionalKey1',
			},
			additionalKey3: {
				message: 'lang1 - additionalKey1',
			},
		});

		expect(fetch.mock.calls).toStrictEqual([
			[
				[
					{
						role: 'user',
						content: translationPrompt(
							JSON.stringify({
								key2: {
									message: 'lang2 - value2',
								},
								key3: {
									message: 'lang2 - value3',
								},
								nestedObject: {
									bar: {
										message: 'lang2 - text',
										baz: {
											message: 'lang2 - text',
										},
									},
									partiallyTranslated: {
										forTranslation: {
											message: 'lang2 - text',
										},
									},
								},
							}),
							'lang2',
							'lang1',
						),
					},
				],
			],
		]);
	});

	test('Filter is skip nodes that is not present in target object', async () => {
		await expect(
			localesManager.sync({
				target: {
					language: 'lang1',
					content: {},
				},
				source: {
					language: 'lang2',
					content: {
						key1: { message: 'lang2 - value1' },
						key2: { message: 'lang2 - value2' },
						key3: { message: 'lang2 - value3' },
						newValue: { message: 'lang2 - newValue' },
						newValue2: { message: 'lang2 - newValue2' },
						newValue3: { message: 'lang2 - newValue3' },
					},
					previous: {
						key1: { message: 'lang2 - old value1' },
						key2: { message: 'lang2 - old value2' },
						key3: { message: 'lang2 - value3' },
					},
				},
				skip(context) {
					if (context.path[0].startsWith('new')) return true;
					return false;
				},
			}),
		).resolves.toStrictEqual({
			key1: { message: 'translated[lang2-lang1] lang2 - value1' },
			key2: { message: 'translated[lang2-lang1] lang2 - value2' },
			key3: { message: 'translated[lang2-lang1] lang2 - value3' },
		});

		expect(fetch.mock.calls).toStrictEqual([
			[
				[
					{
						role: 'user',
						content: translationPrompt(
							JSON.stringify({
								key1: {
									message: 'lang2 - value1',
								},
								key2: {
									message: 'lang2 - value2',
								},
								key3: {
									message: 'lang2 - value3',
								},
							}),
							'lang2',
							'lang1',
						),
					},
				],
			],
		]);
	});
});
