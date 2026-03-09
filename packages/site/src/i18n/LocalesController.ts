import fs from 'node:fs';
import path from 'node:path';

import type { ResourceKey } from 'i18next';

import { i18nContext } from '.';

export class LocalesController {
	constructor(private readonly localesDir: string) {}

	/**
	 * Reads the locales directory and returns
	 * an array of supported language codes
	 * (folder names only).
	 */
	getSupportedLanguages() {
		const localesDirResolvedPath = path.resolve(this.localesDir);

		if (!fs.existsSync(localesDirResolvedPath)) {
			throw new Error(`Locales directory not found: ${localesDirResolvedPath}`);
		}

		return (
			fs
				.readdirSync(localesDirResolvedPath, { withFileTypes: true })
				// .cache dir may appears while development
				// it is created by translation tools
				// so we can ignore that directory
				.filter((dirent) => dirent.isDirectory() && dirent.name !== '.cache')
				.map((dirent) => dirent.name)
		);
	}

	getLocaleResources(
		lang: string,
		namespaces: string[] = [],
	): Record<string, ResourceKey> {
		return Object.fromEntries(
			namespaces.map((ns) => {
				const filePath = path.resolve(`${this.localesDir}/${lang}/${ns}.json`);
				const raw = fs.readFileSync(filePath, 'utf-8');
				return [ns, JSON.parse(raw)];
			}),
		);
	}

	getI18nContext({
		language,
		namespaces,
	}: {
		language: string;
		namespaces: string[];
	}): i18nContext {
		const commonNamespaces = [];
		const resources = this.getLocaleResources(language, [
			...commonNamespaces,
			...namespaces,
		]);

		return {
			lang: language,
			resources,
			// altVersions:
			// 	!path || !path.startsWith('/' + currentLanguage)
			// 		? []
			// 		: SUPPORTED_LANGUAGES.values()
			// 			.map((lang) => {
			// 				const segments = path.split('/');
			// 				segments[1] = lang; // swap language only

			// 				return {
			// 					langCode: lang,
			// 					langName: getNativeLanguageName(lang),
			// 					url: segments.join('/'),
			// 				};
			// 			})
			// 			.toArray(),
		};
	}
}
