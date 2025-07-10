import 'dotenv/config';

import { BasicLLMFetcher } from './BasicLLMFetcher';
import { LLMJsonProcessor } from './LLMJsonProcessor';
import { LLMJsonTranslator } from './LLMJsonTranslator';
import dataSample from './sample.json';
import { getJsonTranslationPrompt } from './utils/prompts';

expect.addSnapshotSerializer({
	test(val) {
		return (
			val &&
			Object.prototype.hasOwnProperty.call(val, 'message') &&
			val.message !== '*REDACTED*'
		);
	},
	serialize(val, config, indentation, depth, refs, printer) {
		return printer(
			{
				...val,
				message: '*REDACTED*',
			},
			config,
			indentation,
			depth,
			refs,
		);
	},
});

test('Translation for a sample localization file', async () => {
	const translator = new LLMJsonTranslator(
		new LLMJsonProcessor(
			new BasicLLMFetcher(
				{
					apiKey: process.env.OPENAI_API_KEY as string,
					baseURL: process.env.OPENAI_BASE_URL,
					dangerouslyAllowBrowser: true,
				},
				{
					model: 'openai/gpt-4.1-mini',
					temperature: 0,
				},
			),
			{ concurrency: 10 },
		),
		{
			translate: getJsonTranslationPrompt,
		},
	);

	await expect(translator.translate(dataSample, 'en', 'ru')).resolves.toMatchSnapshot();
}, 120_000);
