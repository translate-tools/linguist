import { AbstractVersionedStorage, ClassObject, VersionedStorage } from '../types/utils';
import { getMigrationsInfo, updateMigrationsInfoItem } from './migrations';

// Storages
import { ConfigStorage } from '../modules/ConfigStorage/ConfigStorage';
import { PopupWindowStorage } from '../pages/popup/layout/PopupWindow.utils/PopupWindowStorage';
import { TextTranslatorStorage } from '../layouts/TextTranslator/TextTranslator.utils/TextTranslatorStorage';
import { TranslatorsCacheStorage } from '../modules/Background/TranslatorsCacheStorage';

// Standalone migrations
import { migrateSitePreferences } from '../requests/backend/autoTranslation/migrations';

export type Migration = () => Promise<any>;

/**
 * Function for run all migrations
 *
 * Migration is are process of converting data from old format to new.
 * For example, move data from `localStorage` to `indexedDB`
 *
 * NOTE: migration must be lazy i.e. run only by condition and only once
 */
export const migrateAll = async () => {
	const storages: ClassObject<AbstractVersionedStorage, VersionedStorage>[] = [
		ConfigStorage,
		PopupWindowStorage,
		TextTranslatorStorage,
		TranslatorsCacheStorage,
	];

	const migrations: Migration[] = [migrateSitePreferences];

	console.log('Start migrations');

	// Init migrations data
	await updateMigrationsInfoItem({});

	// Verify storages
	storages
		.map((storage, index) => {
			const storageName = storage.publicName;
			if (typeof storageName !== 'string' || storageName.length === 0) {
				console.error('Data for error below', { index, storageName });
				throw new TypeError('Storage must have name');
			}
			return storageName;
		})
		.forEach((storageName, index, names) => {
			if (names.indexOf(storageName) !== index) {
				console.error('Data for error below', { index, storageName });
				throw new Error('Storage names must be unique');
			}
		});

	// Update storages
	const { storageVersions } = await getMigrationsInfo();
	for (const storage of storages) {
		const name = storage.publicName;
		const version = storage.storageVersion;

		// Skip unchanged versions
		if (name in storageVersions && version === storageVersions[name]) continue;

		// Run update
		const oldVersion = storageVersions[name] ?? null;
		await storage.updateStorageVersion(oldVersion);

		// Update storage version
		storageVersions[name] = version;
	}

	// Update storages versions in DB
	await updateMigrationsInfoItem({ storageVersions });

	// Run other migrations
	for (const migration of migrations) {
		await migration().catch((error) => {
			console.error('Migration error', error);
		});
	}

	console.log('End of migrations');
};
