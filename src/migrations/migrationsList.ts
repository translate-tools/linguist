import {
	configureMigration,
	getMigrationsData,
	getMigrationsMetaInfo,
	getMigrationsVersions,
	MigrationTask,
	setMigrationsData,
	setMigrationsVersions,
} from './migrations';

// Storages
import { ConfigStorageMigration } from '../modules/ConfigStorage/migrations';
import { PopupWindowStorageMigration } from '../pages/popup/layout/PopupWindow.utils/migrations';
import { TextTranslatorStorageMigration } from '../layouts/TextTranslator/TextTranslator.utils/migrations';
import { TranslatorsCacheStorageMigration } from '../modules/Background/migrations';
import { SitePreferencesMigration } from '../requests/backend/autoTranslation/migrations';

import browser from 'webextension-polyfill';
import { decodeStruct, type } from '../lib/types';

// TODO: move to another file
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
		name: 'autoTranslationPreferences',
		migration: SitePreferencesMigration,
	},
];

// TODO: move to another file
const migrationsForMigrationsData = configureMigration([
	{
		version: 1,
		async migrate() {
			const browserStorageKey = 'migrationsInfo';
			const { [browserStorageKey]: rawData } = await browser.storage.local.get(
				browserStorageKey,
			);

			const legacyStructure = type.type({
				appConfig: type.number,
				autoTranslateDB: type.number,
				storageVersions: type.record(type.string, type.number),
			});

			// Verify data
			const codec = decodeStruct(legacyStructure, rawData);
			if (codec.errors !== null) return;

			const legacyData = codec.data;

			// Pick storages
			const newData = {
				version: 1,
				dataVersions: legacyData.storageVersions,
			};

			// Rename storage name
			newData.dataVersions.autoTranslationPreferences = legacyData.autoTranslateDB;

			await browser.storage.local.set({ [browserStorageKey]: newData });
		},
	},
]);

// TODO: add tests
/**
 * Run migrations
 *
 * Migration is a process of converting data from a legacy format to an actual format.
 * For example, move data from `localStorage` to `indexedDB`
 *
 * Migrations are not execute for a new users
 */
export const migrateAll = async () => {
	const latestVersion = migrationsForMigrationsData.version;
	const initData = {
		version: latestVersion,
		dataVersions: {},
	};

	// Init migrations data
	const { isMigrationsStorageExist, migrationsStorageVersion } =
		await getMigrationsMetaInfo();
	if (isMigrationsStorageExist) {
		// Migrate data about migrations
		if (latestVersion > migrationsStorageVersion) {
			await migrationsForMigrationsData.migrate(
				migrationsStorageVersion,
				latestVersion,
			);

			const currentData = await getMigrationsData();
			await setMigrationsData({
				...(currentData || initData),
				version: latestVersion,
			});
		}
	} else {
		// Init migrations storage
		await setMigrationsData(initData);
	}

	const migrationsVersions = await getMigrationsVersions();

	// Filter migrations
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
				!(name in migrationsVersions) ||
				migrationsVersions[name] < migration.version;
			return shouldApplyMigration;
		},
	);

	// Not have migrations to apply
	if (migrationsToApply.length === 0) return;

	// Set actual data structure versions and exit for new users
	const shouldOnlySetVersions = !isMigrationsStorageExist;
	if (shouldOnlySetVersions) {
		console.log('Set actual storage versions');

		for (const { name, migration } of migrationsToApply) {
			migrationsVersions[name] = migration.version;
		}

		await setMigrationsVersions(migrationsVersions);
		return;
	}

	console.log('Start migrations');

	// Execute migrations
	for (const { name, migration } of migrationsToApply) {
		const latestVersion = migration.version;

		// Special value '0' for case when storage apply migration first time
		const currentVersion = migrationsVersions[name] ?? 0;

		await migration.migrate(currentVersion, latestVersion);

		// Update storage version
		migrationsVersions[name] = latestVersion;
		await setMigrationsVersions(migrationsVersions);
	}

	console.log('End of migrations');
};
