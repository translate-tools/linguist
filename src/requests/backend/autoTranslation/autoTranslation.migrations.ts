import browser from 'webextension-polyfill';

import { createMigrationTask } from '../../../lib/migrations/createMigrationTask';

import { addLanguage } from './languagePreferences/utils';
import { getPreferences, setPreferences, SiteData } from './sitePreferences/utils';

export const AutoTranslationMigration = createMigrationTask([
	{
		version: 1,
		/**
		 * Migrate data from `browser.storage` to a IDB
		 */
		async migrate() {
			// Migrate preferences for sites
			const sitePreferencesStoragePrefix = 'SitePreferences:';
			const browserStorage = await browser.storage.local.get();
			for (const key in browserStorage) {
				// Skip
				if (!key.startsWith(sitePreferencesStoragePrefix)) continue;

				// Move item data
				const entry = browserStorage[key];
				if (typeof entry === 'object' && 'translateAlways' in entry) {
					const domain = key.slice(sitePreferencesStoragePrefix.length);
					if (domain.length > 0) {
						const currentPreferences = await getPreferences(domain);
						const preferences: SiteData = currentPreferences || {
							enableAutoTranslate: false,
							autoTranslateLanguages: [],
							autoTranslateIgnoreLanguages: [],
						};

						const enableAutoTranslate = Boolean(entry.translateAlways);
						setPreferences(domain, {
							...preferences,
							...{ enableAutoTranslate },
						});
					}
				}

				// Remove item
				await browser.storage.local.remove(key);
			}

			// Migrate preferences for languages
			const languagesKey = 'autoTranslatedLangs';
			const langsResponse = await browser.storage.local.get(languagesKey);
			if (languagesKey in langsResponse) {
				// Migrate languages
				const languages = langsResponse[languagesKey];
				if (Array.isArray(languages)) {
					for (const lang of languages) {
						// Skip invalid types
						if (typeof lang !== 'string') continue;

						// Add language
						await addLanguage(lang, true);
					}
				}

				// Remove from storage
				await browser.storage.local.remove(languagesKey);
			}
		},
	},
]);
