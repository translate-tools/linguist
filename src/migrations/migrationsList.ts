import { AbstractVersionedStorage, ClassObject, VersionedStorage } from '../types/utils';
import { getMigrationsInfo, updateMigrationsInfoItem } from './migrations';

// Storages
import { ConfigStorage } from '../modules/ConfigStorage/ConfigStorage';
import { PopupWindowStorage } from '../pages/popup/layout/PopupWindow.utils/PopupWindowStorage';
import { TextTranslatorStorage } from '../layouts/TextTranslator/TextTranslator.utils/TextTranslatorStorage';

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
	// TODO: verify names to prevent duplicates
	const storages: ClassObject<AbstractVersionedStorage, VersionedStorage>[] = [
		// TODO: remove cast
		ConfigStorage as unknown as ClassObject<
			AbstractVersionedStorage,
			VersionedStorage
		>,
		PopupWindowStorage,
		TextTranslatorStorage,
	];

	const migrations: Migration[] = [migrateSitePreferences];

	console.log('Start migrations');

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
