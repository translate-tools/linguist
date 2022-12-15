import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { decodeStruct, type } from '../lib/types';

const migrationsStructure = type.type({
	version: type.number,
	dataVersions: type.record(type.string, type.number),
});

type MigrationsData = TypeOf<typeof migrationsStructure>;

const storageName = 'migrationsInfo';

export const getMigrationsMetaInfo = async () => {
	const storage = await browser.storage.local.get(storageName);
	const isMigrationsStorageExist = storageName in storage;
	const migrationsStorageVersion =
		isMigrationsStorageExist && typeof storage[storageName].version === 'number'
			? storage[storageName].version
			: 0;

	return {
		isMigrationsStorageExist,
		migrationsStorageVersion,
	};
};

export const getMigrationsData = async () => {
	const { [storageName]: rawData } = await browser.storage.local.get(storageName);

	// Verify data
	const codec = decodeStruct(migrationsStructure, rawData);
	if (codec.errors !== null) return null;

	return codec.data;
};

export const setMigrationsData = async (migrationsData: MigrationsData) => {
	await browser.storage.local.set({ [storageName]: migrationsData });
};

export const getMigrationsVersions = async () => {
	const migrationsData = await getMigrationsData();
	return migrationsData ? migrationsData.dataVersions : {};
};

export const setMigrationsVersions = async (
	migrationsVersions: MigrationsData['dataVersions'],
) => {
	const migrationsData = await getMigrationsData();

	if (migrationsData === null) {
		throw new TypeError('Migrations data are empty');
	}

	await setMigrationsData({ ...migrationsData, dataVersions: migrationsVersions });
};

// TODO: split this file to 2 files

export type MigrationTask = {
	/**
	 * Data structure version
	 */
	version: number;

	/**
	 * Function to migrate data
	 *
	 * WARNING: previous version may contain `0` in case when data structure run migration first time
	 */
	migrate: (previousVersion: number, currentVersion: number) => Promise<void>;
};

export type MigrationObject = {
	version: number;
	migrate: (previousVersion: number) => Promise<void>;
};

export const configureMigration = (migrations: MigrationObject[]): MigrationTask => {
	const sortedMigrations = migrations.sort(
		(migration1, migration2) => migration1.version - migration2.version,
	);

	const latestMigration =
		sortedMigrations.length > 0
			? sortedMigrations[sortedMigrations.length - 1]
			: undefined;
	const lastMigrationVersion = latestMigration ? latestMigration.version : 0;

	return {
		version: lastMigrationVersion,
		migrate: async (fromVersion: number, toVersion: number) => {
			const migrationsToApply = sortedMigrations.filter(
				(migration) =>
					migration.version > fromVersion && migration.version <= toVersion,
			);

			if (migrationsToApply.length === 0) return;

			let currentVersion = fromVersion;
			for (const migration of migrationsToApply) {
				await migration.migrate(currentVersion);
				currentVersion = migration.version;
			}
		},
	};
};
