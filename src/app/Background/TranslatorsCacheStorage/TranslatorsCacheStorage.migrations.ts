import * as IDB from 'idb/with-async-ittr';

import { createMigrationTask } from '../../../lib/migrations/createMigrationTask';

/**
 * An update strategy for this storage is deleting IDB database and re-creating with new structure
 *
 * It's because DB contains only temporary data and IDB version increase while add each new translator,
 * so we can't migrate data by IDB version, because it didn't reflect an IDB structure, but only number of updates.
 */
export const TranslatorsCacheStorageMigration = createMigrationTask([
	{
		version: 2,
		async migrate() {
			const translateModules = [
				'YandexTranslator',
				'GoogleTranslator',
				'BingTranslatorPublic',
			];

			// Remove legacy databases
			for (const translatorName in translateModules) {
				// Format is `translator_` + translator identifier (not its name)
				const LegacyDBName = 'translator_' + translatorName;
				await IDB.deleteDB(LegacyDBName);
			}
		},
	},
	{
		version: 3,
		async migrate() {
			// Drop table with cache, to re-create with new structure
			const DBName = 'translatorsCache';
			await IDB.deleteDB(DBName);
		},
	},
]);
