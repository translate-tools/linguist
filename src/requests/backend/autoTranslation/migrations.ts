import browser from 'webextension-polyfill';

import { SiteData, getPreferences, setPreferences } from './sitePreferences/utils';
import { addLanguage } from './languagePreferences/utils';
import { MigrationTask } from '../../../migrations/migrations';

export const SitePreferencesMigration: MigrationTask = {
	version: 1,
	async migrate(previousVersion) {
		switch (previousVersion) {
			case 0: {
				const allStorageData = await browser.storage.local.get();
				const storagePrefix = 'SitePreferences:';
				const prefixLen = storagePrefix.length;

				// Migrate preferences for sites
				for (const key in allStorageData) {
					// Skip
					if (!key.startsWith(storagePrefix)) continue;

					// Move item data
					const entry = allStorageData[key];
					if (typeof entry === 'object' && 'translateAlways' in entry) {
						const domain = key.slice(prefixLen);
						if (domain.length > 0) {
							// Get current preferences or make new object
							const preferences: SiteData = (await getPreferences(
								domain,
							)) || {
								enableAutoTranslate: false,
								autoTranslateLanguages: [],
								autoTranslateIgnoreLanguages: [],
							};

							const enableAutoTranslate = !!entry.translateAlways;
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
					// Migrate data
					if (Array.isArray(langsResponse[languagesKey])) {
						for (const lang of langsResponse[languagesKey]) {
							// Skip invalid types
							if (typeof lang !== 'string') continue;

							// Add language
							await addLanguage(lang, true);
						}
					}

					// Remove key
					await browser.storage.local.remove(languagesKey);
				}
			}
		}
	},
};
