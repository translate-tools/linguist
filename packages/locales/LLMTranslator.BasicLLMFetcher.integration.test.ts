import 'dotenv/config';

import { BasicLLMFetcher } from './BasicLLMFetcher';
import { LLMTranslator } from './LLMTranslator';
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
	const translator = new LLMTranslator(
		new BasicLLMFetcher(
			{
				apiKey: process.env.OPENAI_API_KEY as string,
				baseURL: process.env.OPENAI_BASE_URL,
				dangerouslyAllowBrowser: true,
			},
			{
				model: process.env.OPENAI_MODEL ?? 'openai/gpt-4.1-mini',
				temperature: 1,
			},
		),
		getJsonTranslationPrompt,
		{ concurrency: 20 },
	);

	await expect(translator.translate(dataSample, 'en', 'ru')).resolves.toMatchSnapshot();
}, 60_000);
