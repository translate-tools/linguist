import * as IDB from 'idb/with-async-ittr';

import { type } from '../../../lib/types';
import { ITranslation, TranslationType } from '../../../types/translation/Translation';

export type ITranslationEntry = ITranslation & {
	date: number;
	translator?: string;
};

// TODO: refactor: keep translation data in property `translation`
export const TranslationEntryType = type.intersection([
	TranslationType,
	type.type({
		// TODO: rename to `timestamp`
		date: type.number,
	}),
	type.partial({
		translator: type.union([type.string, type.undefined]),
	}),
]);

export const TranslationEntryWithKeyType = type.type({
	key: type.number,
	data: TranslationEntryType,
});

export type ITranslationEntryWithKey = { key: number; data: ITranslationEntry };

export interface DBSchema extends IDB.DBSchema {
	translations: {
		key: number;
		value: ITranslationEntry;
		indexes: {
			text: string;
		};
	};
}

type DB = IDB.IDBPDatabase<DBSchema>;

let DBInstance: null | DB = null;
const getDB = async () => {
	const DBName = 'translations';

	if (DBInstance === null) {
		DBInstance = await IDB.openDB<DBSchema>(DBName, 1, {
			upgrade(db) {
				const store = db.createObjectStore('translations', {
					keyPath: 'id',
					autoIncrement: true,
				});

				store.createIndex('text', 'text', { unique: false });
			},
		});
	}

	return DBInstance;
};

export const addEntry = async (entry: ITranslationEntry) => {
	const db = await getDB();
	return db.add('translations', entry);
};

export const deleteEntry = async (entryId: number) => {
	const db = await getDB();
	return db.delete('translations', entryId);
};

export const getEntry = async (entryId: number) => {
	const db = await getDB();
	return db.get('translations', entryId);
};

export const deleteEntries = async (
	entry: Pick<ITranslationEntry, 'from' | 'to' | 'text' | 'translate'>,
) => {
	const db = await getDB();
	const transaction = await db.transaction('translations', 'readwrite');

	// Delete
	const index = await transaction.objectStore('translations').index('text');
	for await (const cursor of index.iterate(entry.text)) {
		const currentEntry = cursor.value;

		console.warn('del dbg: currentEntry', currentEntry);

		if (
			(Object.keys(entry) as (keyof typeof entry)[]).every(
				(key) => entry[key] === currentEntry[key],
			)
		) {
			await cursor.delete();
		}
	}

	await transaction.done;
};

export const flush = async () => {
	const db = await getDB();
	const transaction = await db.transaction('translations', 'readwrite');

	await transaction.store.delete(IDBKeyRange.lowerBound(0));
	await transaction.done;
};

export const getEntries = async (
	from?: number,
	limit?: number,
	options?: { order: 'desc' | 'asc' },
) => {
	const { order = 'desc' } = options ?? {};

	const db = await getDB();

	const transaction = await db.transaction('translations', 'readonly');

	const entries: ITranslationEntryWithKey[] = [];

	let isJumped = false;
	let counter = 0;
	const startCursor = await transaction.store.openCursor(
		null,
		order === 'desc' ? 'prev' : 'next',
	);
	if (startCursor !== null) {
		for await (const cursor of startCursor) {
			// Jump to specified offset
			if (!isJumped && from !== undefined && from > 0) {
				cursor.advance(from);
				isJumped = true;
				continue;
			}

			// Stop by limit
			if (limit !== undefined && ++counter > limit) break;

			// Add entry
			entries.push({
				key: cursor.primaryKey,
				data: cursor.value,
			});
		}
	}

	await transaction.done;

	return entries;
};

export const findEntry = async (entry: Partial<ITranslationEntry>) => {
	const db = await getDB();
	const transaction = await db.transaction('translations', 'readonly');

	let result: ITranslationEntryWithKey | null = null;

	// Find
	const index = await transaction.objectStore('translations').index('text');
	for await (const cursor of index.iterate(entry.text)) {
		const currentEntry = cursor.value;

		if (
			(Object.keys(entry) as (keyof typeof entry)[]).every(
				(key) => entry[key] === currentEntry[key],
			)
		) {
			result = {
				key: cursor.primaryKey,
				data: currentEntry,
			};
			break;
		}
	}

	await transaction.done;

	return result;
};
