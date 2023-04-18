import * as IDB from 'idb/with-async-ittr';

import { LanguageInfo } from './languagePreferences/utils';
import { SiteData } from './sitePreferences/utils';

/**
 * Scheme of current DB
 */
export interface DBSchema extends IDB.DBSchema {
	sitePreferences: {
		key: string;
		value: SiteData;
	};

	autoTranslatedLanguages: {
		key: string;
		value: LanguageInfo;
	};
}

let DBInstance: null | IDB.IDBPDatabase<DBSchema> = null;

/**
 * Open and return DB instance
 */
export const getDBInstance = async () => {
	const DBName = 'autoTranslation';

	if (DBInstance === null) {
		DBInstance = await IDB.openDB<DBSchema>(DBName, 1, {
			// Create DB
			upgrade(db) {
				db.createObjectStore('sitePreferences', {
					autoIncrement: false,
				});

				db.createObjectStore('autoTranslatedLanguages', {
					autoIncrement: false,
				});
			},
		});
	}

	return DBInstance;
};
