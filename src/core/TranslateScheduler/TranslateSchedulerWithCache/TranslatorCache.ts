import * as IDB from 'idb/with-async-ittr';

export interface TranslatorDBSchema extends IDB.DBSchema {
	cache: {
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

type DB = IDB.IDBPDatabase<TranslatorDBSchema>;

interface Options {
	ignoreCase: boolean;
}

type OptionalOptions = { [key in keyof Options]?: Options[key] };

// TODO: make interface
export class TranslatorCache {
	private readonly dbPromise: Promise<DB | undefined>;
	private readonly options: Options = {
		ignoreCase: true,
	};

	private lastError: any;
	constructor(id: string, options?: OptionalOptions) {
		if (options !== undefined) {
			for (const key in options) {
				(this.options as any)[key] = (options as any)[key];
			}
		}

		this.dbPromise = IDB.openDB<TranslatorDBSchema>(`translator_${id}`, 1, {
			upgrade(db) {
				const store = db.createObjectStore('cache', {
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
			const tx = db.transaction('cache');
			const index = tx.store.index('text');

			let result: string | undefined;
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
			const tx = db.transaction('cache', 'readwrite');

			const sourceText = this.options.ignoreCase ? text.toLowerCase() : text;
			await tx.store.put({ from, to, text: sourceText, translate });
			await tx.done;
		});
	}

	public clear() {
		return this.getDB().then((db) => db.clear('cache'));
	}
}
