import { Command } from 'commander';
import { readdirSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { BasicLLMFetcher } from '../../BasicLLMFetcher';
import { LLMJsonProcessor } from '../../LLMJsonProcessor';
import { LLMTranslator } from '../../LLMTranslator';
import { LocalesManager } from '../../LocalesManager';
import { getFileVersion } from '../../utils/git';
import { getJsonTranslationPrompt } from '../../utils/prompts';

import { readFile, writeFile } from 'fs/promises';

const command = new Command('sync');

command
	.argument('language', 'primary language')
	.argument('directory', 'directory where localization files is placed')
	.option('-f --force-update', 'force update all localization keys')
	.option('-b --branch <name>', 'git branch for compare files versions')
	.option('-l --languages <languages list>', 'comma separated languages list to sync')
	.option(
		'-e --excluded-languages <languages list>',
		'comma separated languages list to exclude of sync',
	)
	.action(async (sourceLanguage: string, dir: string, rawOptions: unknown) => {
		const options = z
			.object({
				branch: z.string().optional(),
				forceUpdate: z.boolean().optional(),
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

			return language !== sourceLanguage;
		});

		if (languages.length === 0) {
			console.log('No languages to sync');
			return;
		}

		console.log('Languages to sync', languages);

		const sourceLocaleFilename = path.join(
			resolvedDir,
			sourceLanguage,
			'messages.json',
		);

		const sourceLocale = await readFile(sourceLocaleFilename, {
			encoding: 'utf8',
		}).then((text) => JSON.parse(text));
		const sourceLocalePrevRaw = getFileVersion(
			sourceLocaleFilename,
			options.branch ?? 'master',
		);

		const localesManager = new LocalesManager(
			new LLMTranslator(
				new LLMJsonProcessor(
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
					{ concurrency: 10 },
				),
				getJsonTranslationPrompt,
			),
		);

		for (const targetLanguage of languages) {
			console.log('Sync locales file: ', targetLanguage);

			const targetLanguageFilename = path.join(
				resolvedDir,
				targetLanguage,
				'messages.json',
			);
			const localeObject = options.forceUpdate
				? {}
				: await readFile(targetLanguageFilename, {
					encoding: 'utf8',
				  }).then((text) => JSON.parse(text));

			const syncedLocale = await localesManager.sync({
				source: {
					language: sourceLanguage,
					content: sourceLocale,
					previous: sourceLocalePrevRaw
						? JSON.parse(sourceLocalePrevRaw)
						: undefined,
				},
				target: {
					language: targetLanguage,
					content: localeObject,
				},
			});

			await writeFile(
				targetLanguageFilename,
				JSON.stringify(syncedLocale, null, '\t'),
			);
		}
	});

export default command;
