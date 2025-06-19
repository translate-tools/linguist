import * as IDB from 'idb/with-async-ittr';

import { ITranslation } from '../../../types/translation/Translation';

export interface TranslatorDBSchema extends IDB.DBSchema {
	tableName: { key: string; value: ITranslation; indexes: { originalText: string } };
}
interface Options {
	ignoreCase: boolean;
}
/** * Helper type to cast table name string */
type TableName = 'tableName';
/** * Manage cache by translator id */
export class TranslatorsCacheStorage {
	private dbPromise: Promise<IDB.IDBPDatabase<TranslatorDBSchema>> | null = null;
	private readonly tableName: string;
	private readonly options: Options;
	constructor(id: string, options: Partial<Options> = {}) {
		this.tableName = id;
		this.options = { ignoreCase: true, ...options };
	}
	private getDB() {
		if (this.dbPromise === null) {
			const unsetPromise = () => {
				this.dbPromise = null;
			};
			const DBName = 'translatorsCache';
			const id = this.tableName;
			const dbPromise = IDB.openDB<TranslatorDBSchema>(DBName).then((db) => {
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
						// Clear promise
						if (this.dbPromise === dbPromise) {
							this.dbPromise = null;
						}
						throw reason;
					});
			});
			this.dbPromise = dbPromise;
		}

		return this.dbPromise;
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
