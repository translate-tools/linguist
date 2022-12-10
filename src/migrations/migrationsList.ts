import { getMigrationsInfo, MigrationTask, updateMigrationsInfoItem } from './migrations';

// Storages
import { ConfigStorageMigration } from '../modules/ConfigStorage/ConfigStorage';
import { PopupWindowStorageMigration } from '../pages/popup/layout/PopupWindow.utils/PopupWindowStorage';
import { TextTranslatorStorageMigration } from '../layouts/TextTranslator/TextTranslator.utils/TextTranslatorStorage';
import { TranslatorsCacheStorageMigration } from '../modules/Background/TranslatorsCacheStorage';
import { SitePreferencesMigration } from '../requests/backend/autoTranslation/migrations';

// TODO: review migrations names
const migrationsList: { name: string; migration: MigrationTask }[] = [
	{
		name: 'ConfigStorage',
		migration: ConfigStorageMigration,
	},
	{
		name: 'TextTranslatorStorage',
		migration: TextTranslatorStorageMigration,
	},
	{
		name: 'TranslatorCache',
		migration: TranslatorsCacheStorageMigration,
	},
	{
		name: 'PopupWindowStorage',
		migration: PopupWindowStorageMigration,
	},
	{
		name: 'autoTranslateDB',
		migration: SitePreferencesMigration,
	},
];

/**
 * Function for run all migrations
 *
 * Migration is are process of converting data from old format to new.
 * For example, move data from `localStorage` to `indexedDB`
 *
 * NOTE: migration must be lazy i.e. run only by condition and only once
 */
export const migrateAll = async () => {
	// Init migrations data
	await updateMigrationsInfoItem({});

	// TODO: review migrations utils, automatically init data
	const { storageVersions } = await getMigrationsInfo();

	// Filter storages
	const migrationsToApply = migrationsList.filter(
		(migrationObject, index, migrations) => {
			const { name, migration } = migrationObject;

			if (name.length === 0) {
				console.error('Data for error below', {
					index,
					migration: migrationObject,
				});
				throw new TypeError('Storage must have name');
			}

			const migrationNameIndex = migrations.findIndex(
				(migration) => migration.name === name,
			);
			if (migrationNameIndex !== index) {
				console.error('Data for error below', {
					index,
					migration: migrationObject,
				});
				throw new Error('Storage names must be unique');
			}

			const shouldApplyMigration =
				!(name in storageVersions) || storageVersions[name] < migration.version;
			return shouldApplyMigration;
		},
	);

	if (migrationsToApply.length === 0) return;

	console.log('Start migrations');

	// Update storages
	for (const { name, migration } of migrationsToApply) {
		const currentVersion = migration.version;

		// Special value '0' for case when storage apply migration first time
		const oldVersion = storageVersions[name] ?? 0;

		await migration.migrate(oldVersion, currentVersion);

		// Update storage version
		storageVersions[name] = currentVersion;
		await updateMigrationsInfoItem({ storageVersions });
	}

	console.log('End of migrations');
};
