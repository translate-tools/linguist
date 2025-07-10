import { configureFakeLLMQuery, fakeTranslationPrompt } from './__tests__/llmFetcher';
import { LLMFetcher } from './LLMFetcher';
import { LLMJsonProcessor } from './LLMJsonProcessor';
import { InvalidTranslationPromptFetcher, LLMJsonTranslator } from './LLMJsonTranslator';

const llmQueryMock = vi.fn();

const fakeLLMQuery = configureFakeLLMQuery((json) =>
	json.replaceAll(/:"(.+?)"/g, ':"translated $1"'),
);

beforeEach(() => {
	vi.clearAllMocks();

	llmQueryMock.mockRestore();
	llmQueryMock.mockImplementation(fakeLLMQuery);
});

test('Objects can be translated in single request by fetcher with large limits', async () => {
	const translator = new LLMJsonTranslator(
		new LLMJsonProcessor({
			query: llmQueryMock,
			getLengthLimit() {
				return 3000;
			},
			getRequestsTimeout() {
				return 0;
			},
		} satisfies LLMFetcher),
		{
			translate: fakeTranslationPrompt,
		},
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

	expect(llmQueryMock).toHaveBeenCalledTimes(1);
});

test('Objects can be translated in few request by fetcher with small limits', async () => {
	const translator = new LLMJsonTranslator(
		new LLMJsonProcessor({
			query: llmQueryMock,
			getLengthLimit() {
				return 30;
			},
			getRequestsTimeout() {
				return 0;
			},
		} satisfies LLMFetcher),
		{
			translate: fakeTranslationPrompt,
		},
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

	expect(llmQueryMock).toHaveBeenCalledTimes(2);
});

describe('Fetcher errors handling', () => {
	test('Translator throws error in case with invalid response', async () => {
		const translator = new LLMJsonTranslator(
			new LLMJsonProcessor(
				{
					query: llmQueryMock.mockReturnValue(
						Promise.resolve([
							{
								role: 'assistant',
								content: 'Invalid response',
							},
						]),
					),
					getLengthLimit() {
						return 3000;
					},
					getRequestsTimeout() {
						return 0;
					},
				} satisfies LLMFetcher,
				{ chunkParsingRetriesLimit: 3, backpressureTimeout: null },
			),
			{ translate: fakeTranslationPrompt },
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

		expect(llmQueryMock).toHaveBeenCalledTimes(3);
	});

	test('Translator throws error in case with incomplete response', async () => {
		const translator = new LLMJsonTranslator(
			new LLMJsonProcessor(
				{
					query: llmQueryMock.mockImplementation((messages) =>
						fakeLLMQuery(messages).then((messages) => {
							messages[0].content = JSON.stringify(
								Object.fromEntries(
									Object.entries(JSON.parse(messages[0].content)).slice(
										1,
									),
								),
							);

							return messages;
						}),
					),
					getLengthLimit() {
						return 3000;
					},
					getRequestsTimeout() {
						return 0;
					},
				} satisfies LLMFetcher,
				{ chunkParsingRetriesLimit: 3, backpressureTimeout: null },
			),
			{ translate: fakeTranslationPrompt },
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

		expect(llmQueryMock).toHaveBeenCalledTimes(3);
	});

	test('Translator retries requests in case with invalid response', async () => {
		const translator = new LLMJsonTranslator(
			new LLMJsonProcessor(
				{
					query: llmQueryMock
						.mockReturnValueOnce(
							Promise.resolve([
								{
									role: 'assistant',
									content: 'Invalid response',
								},
							]),
						)
						.mockReturnValueOnce(
							Promise.resolve([
								{
									role: 'assistant',
									content: 'Invalid response',
								},
							]),
						),
					getLengthLimit() {
						return 3000;
					},
					getRequestsTimeout() {
						return 0;
					},
				} satisfies LLMFetcher,
				{ chunkParsingRetriesLimit: 3, backpressureTimeout: null },
			),
			{ translate: fakeTranslationPrompt },
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

		expect(llmQueryMock).toHaveBeenCalledTimes(3);
	});

	test('Translator tries to correct LLM if fixer is provided', async () => {
		const fixer = vi.fn((() => [
			{ role: 'user', content: 'Request to LLM, to fix a problem' },
		]) satisfies InvalidTranslationPromptFetcher);
		const translator = new LLMJsonTranslator(
			new LLMJsonProcessor(
				{
					query: llmQueryMock.mockReturnValueOnce(
						Promise.resolve([
							{
								role: 'assistant',
								content: JSON.stringify({ irrelevantKey: 'value' }),
							},
						]),
					),
					getLengthLimit() {
						return 3000;
					},
					getRequestsTimeout() {
						return 0;
					},
				} satisfies LLMFetcher,
				{ chunkParsingRetriesLimit: 3, backpressureTimeout: null },
			),
			{ translate: fakeTranslationPrompt, fix: fixer },
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

		expect(fixer.mock.calls).toStrictEqual([
			[
				{
					addedPaths: ['irrelevantKey'],
					missedPaths: [
						'foo',
						'bar',
						'object',
						'object.x',
						'object.y',
						'object.text',
					],
					context: {
						from: 'en',
						to: 'de',
						json: {
							bar: 'bar',
							foo: 'foo',
							object: {
								text: 'Some cool text',
								x: 1,
								y: 2,
							},
						},
					},
				},
			],
		]);

		expect(llmQueryMock.mock.calls).toStrictEqual([
			[
				[
					{
						role: 'user',
						content: fakeTranslationPrompt(
							JSON.stringify({
								foo: 'foo',
								bar: 'bar',
								object: {
									x: 1,
									y: 2,
									text: 'Some cool text',
								},
							}),
						),
					},
				],
			],
			[
				[
					{
						role: 'user',
						content: fakeTranslationPrompt(
							JSON.stringify({
								foo: 'foo',
								bar: 'bar',
								object: {
									x: 1,
									y: 2,
									text: 'Some cool text',
								},
							}),
						),
					},
					{
						role: 'assistant',
						content: JSON.stringify({ irrelevantKey: 'value' }),
					},
					{ role: 'user', content: 'Request to LLM, to fix a problem' },
				],
			],
		]);
	});
});
