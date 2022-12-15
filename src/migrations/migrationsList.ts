import { getMigrationsInfo, MigrationTask, updateMigrationsInfoItem } from './migrations';

// Storages
import { ConfigStorageMigration } from '../modules/ConfigStorage/migrations';
import { PopupWindowStorageMigration } from '../pages/popup/layout/PopupWindow.utils/PopupWindowStorage';
import { TextTranslatorStorageMigration } from '../layouts/TextTranslator/TextTranslator.utils/migrations';
import { TranslatorsCacheStorageMigration } from '../modules/Background/migrations';
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
 * Run migrations
 *
 * Migration is a process of converting data from a legacy format to an actual format.
 * For example, move data from `localStorage` to `indexedDB`
 *
 * Migrations are not execute for a new users
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

	// Set actual data structure versions and exit for new users
	const shouldOnlySetVersions = Object.keys(storageVersions).length === 0;
	if (!shouldOnlySetVersions) {
		console.log('Set actual storage versions');
		for (const { name, migration } of migrationsToApply) {
			storageVersions[name] = migration.version;
		}
		await updateMigrationsInfoItem({ storageVersions });

		return;
	}

	console.log('Start migrations');

	// Execute migrations
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
