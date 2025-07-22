import { Command } from 'commander';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { BasicLLMFetcher } from '../../BasicLLMFetcher';
import { LLMJsonProcessor } from '../../LLMJsonProcessor';
import { LLMJsonTranslator } from '../../LLMJsonTranslator';
import { LocalesManager } from '../../LocalesManager';
import { getFileVersion } from '../../utils/git';
import { postprocessLocale } from '../../utils/localeObject';
import { getJsonTranslationPrompt } from '../../utils/prompts';

import { mkdir, readFile, writeFile } from 'fs/promises';

const command = new Command('sync');

command
	.argument('language', 'primary language')
	.argument('directory', 'directory where localization files is placed')
	.option('-s --skip-errors', 'ignore errors while translation and go to next locale')
	.option('-f --force-update', 'force update all localization keys')
	.option('-r --ref <name>', 'git ref for compare files versions')
	.option('-l --languages <languages list>', 'comma separated languages list to sync')
	.option(
		'-e --excluded-languages <languages list>',
		'comma separated languages list to exclude of sync',
	)
	.action(async (sourceLanguage: string, dir: string, rawOptions: unknown) => {
		const options = z
			.object({
				ref: z.string().optional(),
				forceUpdate: z.boolean().optional(),
				skipErrors: z.boolean().optional(),
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
			if (options.excludedLanguages?.includes(language)) {
				return false;
			}

			return language !== sourceLanguage;
		});

		if (languages.length === 0) {
			console.log('No locales found');
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
			options.ref ?? 'master',
		);

		const localesManager = new LocalesManager(
			new LLMJsonTranslator(
				new LLMJsonProcessor(
					new BasicLLMFetcher(
						{
							apiKey: process.env.OPENAI_API_KEY!,
							baseURL: process.env.OPENAI_BASE_URL,
							dangerouslyAllowBrowser: true,
						},
						{
							model: process.env.OPENAI_MODEL ?? 'openai/gpt-4.1-mini',
							temperature: 0,
						},
					),
					{
						concurrency: 10,
						termsLimit: 30,
						chunkParsingRetriesLimit: options.forceUpdate ? 10 : 8,
						backpressureTimeout: {
							base: 100,
							max: options.forceUpdate ? 3000 : 1000,
						},
					},
				),
				{
					translate: getJsonTranslationPrompt,
					onProcessed(info) {
						console.log(`Translated ${info.completed}/${info.total}`);
					},
					onParsingError(text) {
						console.log('Invalid JSON', text);

						return [
							{
								role: 'user',
								content:
									'Your JSON is invalid. Fix it and send me back valid JSON',
							},
						];
					},
					fix({ missedPaths, addedPaths }) {
						return [
							{
								role: 'user',
								content:
									[
										'Incorrect!',
										missedPaths.length > 0 &&
											`You missed next paths in your result:\n${missedPaths.join(
												'\n',
											)}\n`,
										addedPaths.length > 0 &&
											`You added next paths that is not needed:\n${addedPaths.join(
												'\n',
											)}\n`,
									]
										.filter(Boolean)
										.join('\n') +
									'\n\nPlease fix this problems and return me correct JSON with no comments',
							},
						];
					},
				},
			),
		);

		for (const index in languages) {
			try {
				const targetLanguage = languages[index];

				const targetLanguageFilename = path.join(
					resolvedDir,
					targetLanguage,
					'messages.json',
				);

				const isFileExists = existsSync(targetLanguageFilename);

				console.log(
					[
						`Sync locale "${targetLanguage}"`,
						!isFileExists && '(new)',
						`[${Number(index) + 1}/${languages.length}]`,
					]
						.filter(Boolean)
						.join(' '),
				);

				let localeObject = {};

				// Load and parse file content in case file exists and force update is not requested
				if (isFileExists && !options.forceUpdate) {
					localeObject = await readFile(targetLanguageFilename, {
						encoding: 'utf8',
					}).then((text) => JSON.parse(text));
				}

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

				await mkdir(path.dirname(targetLanguageFilename), { recursive: true });
				await writeFile(
					targetLanguageFilename,
					JSON.stringify(postprocessLocale(syncedLocale), null, '\t'),
				);
			} catch (error) {
				if (options.skipErrors) {
					console.log('Error while locale translation', error);
					console.log('Ignore error, since passed flag --skip-errors');
					continue;
				} else {
					throw error;
				}
			}
		}
	});

export default command;
