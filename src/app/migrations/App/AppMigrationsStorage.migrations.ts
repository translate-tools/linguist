import browser from 'webextension-polyfill';

import { createMigrationTask } from '../../../lib/migrations/createMigrationTask';
import { decodeStruct, type } from '../../../lib/types';

export const migrationsForMigrationsStorage = createMigrationTask([
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
