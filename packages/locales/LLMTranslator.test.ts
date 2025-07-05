import { LLMFetcher } from './LLMFetcher';
import { LLMTranslator } from './LLMTranslator';

const fetch = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();

	fetch.mockRestore();
	fetch.mockImplementation(async (json: string) => {
		return json.replaceAll(/:"(.+?)"/g, ':"translated $1"');
	});
});

test('Objects can be translated in single request by fetcher with large limits', async () => {
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
		(json) => json,
	);

	await expect(
		translator.translate(
			{
				foo: 'foo',
				bar: 'bar',
				object: {
					x: 1,
					y: 2,
					text: 'Some cool text',
				},
			},
			'en',
			'de',
		),
	).resolves.toEqual({
		foo: 'translated foo',
		bar: 'translated bar',
		object: {
			x: 1,
			y: 2,
			text: 'translated Some cool text',
		},
	});

	expect(fetch).toHaveBeenCalledTimes(1);
});

test('Objects can be translated in few request by fetcher with small limits', async () => {
	const translator = new LLMTranslator(
		{
			fetch,
			getLengthLimit() {
				return 30;
			},
			getRequestsTimeout() {
				return 0;
			},
		} satisfies LLMFetcher,
		(json) => json,
	);

	await expect(
		translator.translate(
			{
				foo: 'foo',
				bar: 'bar',
				object: {
					x: 1,
					y: 2,
					text: 'Some cool text',
				},
			},
			'en',
			'de',
		),
	).resolves.toEqual({
		foo: 'translated foo',
		bar: 'translated bar',
		object: {
			x: 1,
			y: 2,
			text: 'translated Some cool text',
		},
	});

	expect(fetch).toHaveBeenCalledTimes(2);
});

describe('Fetcher errors handling', () => {
	test('Translator throws error in case with invalid response', async () => {
		const translator = new LLMTranslator(
			{
				fetch: fetch.mockReturnValue(Promise.resolve('Invalid response')),
				getLengthLimit() {
					return 3000;
				},
				getRequestsTimeout() {
					return 0;
				},
			} satisfies LLMFetcher,
			(json) => json,
		);

		await expect(
			translator.translate(
				{
					foo: 'foo',
					bar: 'bar',
					object: {
						x: 1,
						y: 2,
						text: 'Some cool text',
					},
				},
				'en',
				'de',
			),
		).rejects.toThrow(`Unexpected token`);

		expect(fetch).toHaveBeenCalledTimes(3);
	});

	test('Translator throws error in case with incomplete response', async () => {
		const translator = new LLMTranslator(
			{
				fetch: fetch.mockImplementation((json) =>
					JSON.stringify(
						Object.fromEntries(Object.entries(JSON.parse(json)).slice(1)),
					),
				),
				getLengthLimit() {
					return 3000;
				},
				getRequestsTimeout() {
					return 0;
				},
			} satisfies LLMFetcher,
			(json) => json,
		);

		await expect(
			translator.translate(
				{
					foo: 'foo',
					bar: 'bar',
					object: {
						x: 1,
						y: 2,
						text: 'Some cool text',
					},
				},
				'en',
				'de',
			),
		).rejects.toThrow(`Not equal structures`);

		expect(fetch).toHaveBeenCalledTimes(3);
	});

	test('Translator retries requests in case with invalid response', async () => {
		const translator = new LLMTranslator(
			{
				fetch: fetch
					.mockReturnValueOnce(Promise.resolve('Invalid response'))
					.mockReturnValueOnce(Promise.resolve('Invalid response')),
				getLengthLimit() {
					return 3000;
				},
				getRequestsTimeout() {
					return 0;
				},
			} satisfies LLMFetcher,
			(json) => json,
		);

		await expect(
			translator.translate(
				{
					foo: 'foo',
					bar: 'bar',
					object: {
						x: 1,
						y: 2,
						text: 'Some cool text',
					},
				},
				'en',
				'de',
			),
		).resolves.toEqual({
			foo: 'translated foo',
			bar: 'translated bar',
			object: {
				x: 1,
				y: 2,
				text: 'translated Some cool text',
			},
		});

		expect(fetch).toHaveBeenCalledTimes(3);
	});
});
