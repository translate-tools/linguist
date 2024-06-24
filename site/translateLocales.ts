import path from 'path';
import { Scheduler } from '@translate-tools/core/scheduling/Scheduler';
import { YandexTranslator } from '@translate-tools/core/translators/YandexTranslator';

import { readFile, writeFile } from 'fs/promises';
import { languages } from './supportedLanguages';

const translator = new Scheduler(new YandexTranslator());

const translateObject = async (value: any, from: string, to: string) => {
	if (typeof value !== 'object' || value === null) {
		if (typeof value === 'string') {
			return translator.translate(value, from, to).then((translatedText) => {
				// TODO: search for not closed tags and panic or return original message
				return (translatedText as any)
					.replaceAll('&lt;', '<')
					.replaceAll('&gt;', '>');
			});
		}
		return value;
	}

	if (Array.isArray(value)) {
		return Promise.all(value.map((item) => translateObject(item, from, to)));
	}

	return Object.fromEntries(
		await Promise.all(
			Object.entries(value).map(async ([key, value]) => [
				key,
				await translateObject(value, from, to),
			]),
		),
	);
};

const sourceLanguage = 'en';
const localesDirectories = ['./src/components/Landing/locales'];

(async () => {
	for (const localesDir of localesDirectories) {
		console.log(`Translate locales in ${localesDir}`);

		const source = await readFile(
			path.join(localesDir, sourceLanguage + '.json'),
		).then((buffer) => JSON.parse(buffer.toString()));
		const langs = languages.filter((lang) => lang !== sourceLanguage);
		for (const lang of langs) {
			console.log(`Translate messages for "${lang}"`);
			const translatedObject = await translateObject(source, sourceLanguage, lang);
			await writeFile(
				path.join(localesDir, lang + '.json'),
				JSON.stringify(translatedObject, null, '\t'),
			);
		}
	}
})();
