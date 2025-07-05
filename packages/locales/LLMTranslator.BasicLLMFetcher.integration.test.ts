import 'dotenv/config';

import { BasicLLMFetcher } from './BasicLLMFetcher';
import { LLMTranslator } from './LLMTranslator';
import dataSample from './sample.json';

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
		(json, from, to) => {
			// use full language name
			const langFormatter = new Intl.DisplayNames(['en'], { type: 'language' });
			const originLang = from == 'auto' ? 'auto' : langFormatter.of(from);
			const targetLang = langFormatter.of(to);

			return `You are a translation service for translate localization files.
		
		I will provide a JSON string with text, and your task is to translate all string values (not keys) from language ${originLang} to language ${targetLang}.

		If I specify the source language as 'auto', you should automatically detect it and translate it into the target language I set.

		The JSON object in your response must have the same structure and length as the one in the request. Do not add any explanations — translate strictly according to the content and its context.

		You must never change any key values in object.
		You can use object keys to understand context.

		Be careful when creating an JSON object; it must be syntactically correct and do not change quotation marks.

		Here is the JSON array of texts: ${json}`;
		},
		{ concurrency: 20 },
	);

	await expect(translator.translate(dataSample, 'en', 'ru')).resolves.toMatchSnapshot();
}, 320_000);
