import * as IDB from 'idb/with-async-ittr';

export interface TranslatorDBSchema extends IDB.DBSchema {
	[key: string]: {
		key: string;
		value: {
			from: string;
			to: string;
			text: string;
			translate: string;
		};
		indexes: {
			text: string;
		};
	};
}

type DB = IDB.IDBPDatabase<any>;

interface Options {
	ignoreCase: boolean;
}

type OptionalOptions = { [key in keyof Options]?: Options[key] };

const DBName = 'translatorsCache';

// TODO: write migrations
// TODO: refactor me
export class TranslatorCache {
	private readonly dbPromise: Promise<DB | undefined>;
	private readonly options: Options = {
		ignoreCase: true,
	};

	private tableName: string;
	private lastError: any;

	constructor(id: string, options?: OptionalOptions) {
		this.tableName = id;

		if (options !== undefined) {
			for (const key in options) {
				(this.options as any)[key] = (options as any)[key];
			}
		}

		this.dbPromise = IDB.openDB<any>(DBName).then((db) => {
			// Return DB if storage exist
			if (db.objectStoreNames.contains(id)) return db;

			// Otherwise create storage
			const nextVersion = db.version + 1;

			return IDB.openDB<any>(DBName, nextVersion, {
				upgrade(db) {
					const store = db.createObjectStore(id, {
						keyPath: 'id',
						autoIncrement: true,
					});

					store.createIndex('text', 'text', { unique: true });
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

	private getDB() {
		return this.dbPromise.then((db) => {
			if (db === undefined) {
				throw this.lastError;
			}

			return db;
		});
	}

	public get(text: string, from: string, to: string) {
		return this.getDB().then(async (db) => {
			const tx = db.transaction(this.tableName);
			const index = tx.store.index('text');

			let result: string | null = null;
			const sourceText = this.options.ignoreCase ? text.toLowerCase() : text;
			for await (const cursor of index.iterate(sourceText)) {
				if (cursor.value.from === from && cursor.value.to === to) {
					result = cursor.value.translate;
					break;
				}
			}

			await tx.done;
			return result;
		});
	}

	public set(text: string, translate: string, from: string, to: string) {
		return this.getDB().then(async (db) => {
			const tx = db.transaction(this.tableName, 'readwrite');

			const sourceText = this.options.ignoreCase ? text.toLowerCase() : text;
			await tx.store.put({ from, to, text: sourceText, translate });
			await tx.done;
		});
	}

	public clear() {
		return this.getDB().then((db) => db.clear(this.tableName));
	}
}
