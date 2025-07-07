import { Command } from 'commander';
import { readdirSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { readFile, writeFile } from 'fs/promises';

export const orderKeysInLocalizationObject = (
	object: Record<any, any>,
	sortPredicate = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0),
) =>
	Object.fromEntries(
		Object.entries(object).sort(([keyA], [keyB]) => {
			const weightA = keyA.startsWith('langCode_') ? 1 : 0;
			const weightB = keyB.startsWith('langCode_') ? 1 : 0;

			if (typeof weightA === 'number' || typeof weightB === 'number') {
				if (typeof weightA === 'number' && typeof weightB === 'number')
					return weightA === weightB
						? sortPredicate(keyA, keyB)
						: sortPredicate(weightA, weightB);

				return typeof weightA === 'number' ? 1 : -1;
			}

			return sortPredicate(keyA, keyB);
		}),
	);

const command = new Command('prettify');

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
				`Prettify locale "${language}" [${Number(index) + 1}/${
					languages.length
				}]`,
			);

			const localeFilename = path.join(resolvedDir, language, 'messages.json');

			const sourceLocale = await readFile(localeFilename, {
				encoding: 'utf8',
			}).then((text) => JSON.parse(text));

			await writeFile(
				localeFilename,
				JSON.stringify(orderKeysInLocalizationObject(sourceLocale), null, '\t'),
			);
		}
	});

export default command;
