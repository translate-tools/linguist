import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { tryDecode, type } from '../lib/types';

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
