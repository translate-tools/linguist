// import { browser } from 'webextension-polyfill-ts';

// import { Migration } from '../../../../migrations/migrationsList';
// import {
// 	getMigrationsInfo,
// 	updateMigrationsInfoItem,
// } from '../../../../migrations/migrations';

// import { SiteData, getPreferences, setPreferences } from './utils';

// export const migrateSitePreferences: Migration = () =>
// 	getMigrationsInfo().then(async ({ autoTranslateDB }) => {
// 		switch (autoTranslateDB) {
// 		case 0: {
// 			const allStorageData = await browser.storage.local.get();
// 			const storagePrefix = 'SitePreferences:';
// 			const prefixLen = storagePrefix.length;

// 			for (const key in allStorageData) {
// 				// Skip
// 				if (!key.startsWith(storagePrefix)) continue;

// 				const entry = allStorageData[key];

// 				// Migrate data
// 				if (typeof entry === 'object' && 'translateAlways' in entry) {
// 					const domain = key.slice(prefixLen);
// 					if (domain.length > 0) {
// 						const preferences: SiteData = (await getPreferences(
// 							domain,
// 						)) || {
// 							autoTranslateLanguages: [],
// 							enableAutoTranslate: false,
// 						};

// 						const enableAutoTranslate = !!entry.translateAlways;
// 						setPreferences(domain, {
// 							...preferences,
// 							...{ enableAutoTranslate },
// 						});
// 					}
// 				}

// 				// Remove item
// 				await browser.storage.local.remove(key);
// 			}

// 			// Update migrate info to migrated method version
// 			await updateMigrationsInfoItem({ autoTranslateDB: 1 });
// 		}
// 		}
// 	});

// TODO: replace to real migration
export const migrateSitePreferences = () => Promise.resolve();
