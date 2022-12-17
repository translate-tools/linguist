import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { decodeStruct, type } from '../../lib/types';

const migrationsStructure = type.type({
	version: type.number,
	dataVersions: type.record(type.string, type.number),
});

type MigrationsData = TypeOf<typeof migrationsStructure>;

const storageName = 'migrationsInfo';

export const getMigrationsMetaInfo = async () => {
	const storage = await browser.storage.local.get(storageName);
	const isMigrationsStorageExist =
		storageName in storage && storage[storageName] !== undefined;
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
