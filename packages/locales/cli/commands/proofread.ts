import { Command } from 'commander';
import { readdirSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { BasicLLMFetcher } from '../../BasicLLMFetcher';
import { LLMJsonProcessor } from '../../LLMJsonProcessor';
import { orderKeysInLocalizationObject } from '../../utils/localeObject';
import { codeBlock } from '../../utils/prompts';

import { readFile, writeFile } from 'fs/promises';

const command = new Command('proofread');

command
	.argument('directory', 'directory where localization files is placed')
	.option(
		'-l --languages <languages list>',
		'comma separated languages list for processing',
	)
	.option(
		'-e --excluded-languages <languages list>',
		'comma separated languages list to exclude of processing',
	)
	.action(async (dir: string, rawOptions: unknown) => {
		const options = z
			.object({
				languages: z
					.string()
					.transform((str) => str.split(','))
					.optional(),
				excludedLanguages: z
					.string()
					.transform((str) => str.split(','))
					.optional(),
			})
			.parse(rawOptions);

		const resolvedDir = path.resolve(dir);
		console.log('Localization files dir', resolvedDir);

		const languages = (
			options.languages ?? z.string().array().parse(readdirSync(resolvedDir))
		).filter((language) => {
			if (
				options.excludedLanguages &&
				options.excludedLanguages.includes(language)
			) {
				return false;
			}

			return true;
		});

		if (languages.length === 0) {
			console.log('No locales found');
			return;
		}

		for (const index in languages) {
			const language = languages[index];

			console.log(
				`Proofread locale "${language}" [${Number(index) + 1}/${
					languages.length
				}]`,
			);

			const jsonProcessor = new LLMJsonProcessor(
				new BasicLLMFetcher(
					{
						apiKey: process.env.OPENAI_API_KEY as string,
						baseURL: process.env.OPENAI_BASE_URL,
						dangerouslyAllowBrowser: true,
					},
					{
						model: process.env.OPENAI_MODEL ?? 'openai/gpt-4.1-mini',
						temperature: 0,
					},
				),
				{ concurrency: 10 },
			);

			const localeFilename = path.join(resolvedDir, language, 'messages.json');

			const sourceLocale = await readFile(localeFilename, {
				encoding: 'utf8',
			}).then((text) => JSON.parse(text));

			const fixedTexts = await jsonProcessor.process(sourceLocale, {
				prompt(json) {
					const prettifiedJson = JSON.stringify(JSON.parse(json), null, 2);

					return `You are a proofreading service for localization files.
	
					I will provide a JSON string with text, and your purpose is to fix all string values (not keys).
	
					The JSON object in your response must have the same structure and length as the one in the request.
					
					Do not add any explanations — fix text strictly according to the content and its context.
	
					Your response must contain only valid raw JSON text with no any formatting and with no code block.
	
					# Proofreading specification
	
					You must never change any key values in object.
					You can use object keys to understand context.
	
					You must fix only values in "message" property.
					
					Never fix anything except "message" property, it's just a context to help you understand how this "message" will be used.
	
					You may rephrase texts to make it look native for target language, but you must keep the common sense of every "message" according to its context of use.
	
					You should fix any grammar issues and typos.

					You must never add any dots at end of sentences, because you don't know how it will be used and you will break some use cases.

					You must never change slogans and marketing descriptions for a products.

					Never change text intention. For example, if text is formulated as an question, you must never remove question mark.
	
					In case a message have no problems, you must leave it as is.
	
					Be careful when creating an JSON object; it must be syntactically correct and do not change quotation marks.

					Never change texts if it not necessary. Preserve original text always when it is possible.
					This is critical error if you will change text that is fine and not require any changes.
	
					# The context

					You must consider next project description as context when you work on localization:

					> Linguist is a browser extension for translate web pages. It is a full-featured translation solution.
					> With Linguist user may run full page translation, translate any custom text, translate selected text.
					> Linguist supports a custom translators, so user can add its own implementation of translator module.
					> Linguist is a privacy focused, includes embedded modules for offline translation in user device (locally).

					# Your task
	
					Here is the JSON to proofread:
					${codeBlock(prettifiedJson, 'json')}
					`;
				},
				filter(context) {
					// Skip language names
					if (context.path[0].startsWith('langCode_')) return false;

					return true;
				},
			});

			await writeFile(
				localeFilename,
				JSON.stringify(orderKeysInLocalizationObject(fixedTexts), null, '\t'),
			);
		}
	});

export default command;
