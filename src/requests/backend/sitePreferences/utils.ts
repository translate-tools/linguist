// TODO: keep it in indexDB and show list on options page

import * as IDB from 'idb/with-async-ittr';
import { TypeOf } from 'io-ts';
import { type } from '../../../lib/types';

export const dataSignature = type.type({
	/**
	 * While `false`, auto translate will not work, while `true` will work with consider other options
	 */
	enableAutoTranslate: type.boolean,

	/**
	 * While size greater than 0, page language code must be in array
	 */
	autoTranslateLanguages: type.array(type.string),
});

export type SiteData = TypeOf<typeof dataSignature>;

export type IEntryWithKey = { key: number; data: SiteData };

export interface DBSchema extends IDB.DBSchema {
	sitePreferences: {
		key: string;
		value: SiteData;
	};
}

type DB = IDB.IDBPDatabase<DBSchema>;

let DBInstance: null | DB = null;
const getDB = async () => {
	const DBName = 'autoTranslation';

	if (DBInstance === null) {
		DBInstance = await IDB.openDB<DBSchema>(DBName, 1, {
			upgrade(db) {
				db.createObjectStore('sitePreferences', {
					// keyPath: 'site',
					autoIncrement: false,
				});
			},
		});
	}

	return DBInstance;
};

// TODO: migrate data from `translateAlways`
// const storageKeyPrefix = 'SitePreferences:';

export const setPreferences = async (site: string, options: SiteData) => {
	const db = await getDB();
	await db.put('sitePreferences', options, site);
};

export const getPreferences = async (site: string) => {
	const db = await getDB();
	const entry = await db.get('sitePreferences', site);

	return entry ?? null;
};
