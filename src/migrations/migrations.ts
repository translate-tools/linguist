import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { tryDecode, type } from '../lib/types';

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

const migrationsSignature = type.type({
	appConfig: type.number,
	autoTranslateDB: type.number,
	storageVersions: type.record(type.string, type.number),
});

type Data = TypeOf<typeof migrationsSignature>;

const initData: Data = {
	appConfig: 0,
	autoTranslateDB: 0,
	storageVersions: {},
};

export const getMigrationsInfo = async () => {
	const migrationsInfoRaw = (await browser.storage.local.get('migrationsInfo'))[
		'migrationsInfo'
	];

	// Try load data
	const tryLoadData = () => {
		try {
			return tryDecode(migrationsSignature, migrationsInfoRaw);
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
		}

		return null;
	};

	// Try merge init data and current
	const tryMergeWithInit = () => {
		try {
			if (typeof migrationsInfoRaw === 'object') {
				const mergedData: Data = { ...initData, ...migrationsInfoRaw };
				return tryDecode(migrationsSignature, mergedData);
			}
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
		}

		return null;
	};

	let migrationsInfo: Data | null = null;

	// Try get data
	migrationsInfo = tryLoadData();

	if (migrationsInfo === null) {
		migrationsInfo = tryMergeWithInit();
	}
	if (migrationsInfo === null) {
		migrationsInfo = initData;
	}

	return migrationsInfo;
};

export const updateMigrationsInfoItem = async (data: Partial<Data>) => {
	const actualData = await getMigrationsInfo();

	await browser.storage.local.set({ migrationsInfo: { ...actualData, ...data } });
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
