import { LLMFetcher } from './LLMFetcher';
import { LLMTranslator } from './LLMTranslator';
import { LocalesManager } from './LocalesManager';

const fetch = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();

	fetch.mockRestore();
	fetch.mockImplementation(async (request: string) => request);
});

const translator = new LLMTranslator(
	{
		fetch,
		getLengthLimit() {
			return 3000;
		},
		getRequestsTimeout() {
			return 0;
		},
	} satisfies LLMFetcher,
	(json, from, to) => json.replaceAll(/:"(.+?)"/g, `:"translated[${from}-${to}] $1"`),
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
