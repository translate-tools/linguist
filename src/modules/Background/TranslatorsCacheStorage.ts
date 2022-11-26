import * as IDB from 'idb/with-async-ittr';

import { translatorModules } from '.';
import { ITranslation } from '../../types/translation/Translation';

import { AbstractVersionedStorage } from '../../types/utils';

export interface TranslatorDBSchema extends IDB.DBSchema {
	tableName: {
		key: string;
		value: ITranslation;
		indexes: {
			originalText: string;
		};
	};
}

type DB = IDB.IDBPDatabase<TranslatorDBSchema>;

/**
 * Helper type to cast table name string
 */
type TableName = 'tableName';

interface Options {
	ignoreCase: boolean;
}

const DBName = 'translatorsCache';

// TODO: refactor me
/**
 * Data are stores in IDB
 */
export class TranslatorsCacheStorage extends AbstractVersionedStorage {
	static publicName = 'TranslatorCache';
	static storageVersion = 3;

	/**
	 * An update strategy for this storage is deleting IDB database and re-creating with new structure
	 *
	 * It's because DB contains only temporary data and IDB version increase while add each new translator,
	 * so we can't migrate data by IDB version, because it didn't reflect an IDB structure, but only number of updates.
	 */
	public static async updateStorageVersion(prevVersion: number | null) {
		// Remove legacy databases
		if (prevVersion === null || prevVersion < 2) {
			for (const translatorName in translatorModules) {
				// Format is `translator_` + translator identifier (not its name)
				const LegacyDBName = 'translator_' + translatorName;
				await IDB.deleteDB(LegacyDBName);
			}
			return;
		}

		switch (prevVersion) {
			case 2: {
				// Drop table with cache, to re-create with new structure
				await IDB.deleteDB(DBName);
				break;
			}
		}
	}

	private dbPromise: null | Promise<DB | undefined> = null;
	private readonly options: Options = {
		ignoreCase: true,
	};

	private tableName: string;
	private lastError: any;

	constructor(id: string, options?: Partial<Options>) {
		super();

		this.tableName = id;

		if (options !== undefined) {
			for (const key in options) {
				(this.options as any)[key] = (options as any)[key];
			}
		}
	}

	private getDB() {
		if (this.dbPromise === null) {
			const unsetPromise = () => {
				this.dbPromise = null;
			};

			const id = this.tableName;
			this.dbPromise = IDB.openDB<TranslatorDBSchema>(DBName).then((db) => {
				// Prevent versionchange blocking
				db.addEventListener('versionchange', () => {
					db.close();
					unsetPromise();
				});

				// Return DB if storage exist
				if (db.objectStoreNames.contains(id as TableName)) return db;

				// Otherwise create storage
				const nextVersion = db.version + 1;

				return IDB.openDB<TranslatorDBSchema>(DBName, nextVersion, {
					upgrade(db) {
						const store = db.createObjectStore(id as TableName, {
							keyPath: 'id',
							autoIncrement: true,
						});

						store.createIndex('originalText', 'originalText', {
							unique: true,
						});

						// Prevent versionchange blocking
						db.addEventListener('versionchange', () => {
							db.close();
							unsetPromise();
						});
					},
				})
					.then((db) => {
						return db;
					})
					.catch((reason) => {
						this.lastError = reason;
						return undefined;
					});
			});
		}

		return this.dbPromise.then((db) => {
			if (db === undefined) {
				throw this.lastError;
			}

			return db;
		});
	}

	public get(text: string, from: string, to: string) {
		return this.getDB().then(async (db) => {
			const tx = db.transaction(this.tableName as TableName, 'readonly');
			const index = tx.store.index('originalText');

			let result: string | null = null;
			const sourceText = this.options.ignoreCase ? text.toLowerCase() : text;
			for await (const cursor of index.iterate(sourceText)) {
				if (cursor.value.from === from && cursor.value.to === to) {
					result = cursor.value.translatedText;
					break;
				}
			}

			await tx.done;
			return result;
		});
	}

	public set(originalText: string, translatedText: string, from: string, to: string) {
		return this.getDB().then(async (db) => {
			const tx = db.transaction(this.tableName as TableName, 'readwrite');

			const transformedOriginalText = this.options.ignoreCase
				? originalText.toLowerCase()
				: originalText;
			await tx.store.put({
				from,
				to,
				originalText: transformedOriginalText,
				translatedText,
			});
			await tx.done;
		});
	}

	public clear() {
		// TODO: remove DB instead of clear
		return this.getDB().then((db) => db.clear(this.tableName as TableName));
	}
}
