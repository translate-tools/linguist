import * as IDB from 'idb/with-async-ittr';

import { type } from '../../../lib/types';

// TODO: introduce `Translation` type and its variants + runtime types
export type ITranslation = {
	from: string;
	to: string;
	text: string;
	translate: string;
};

export type HistoryEntry = {
	translation: ITranslation;
	origin: string;
	timestamp: number;
};

export type IEntryWithKey = { key: number; data: HistoryEntry };

export const EntryWithKey = type.type({
	key: type.number,
	// data: TranslationEntry,
});

export interface DBSchema extends IDB.DBSchema {
	translationsHistory: {
		key: number;
		value: HistoryEntry;
	};
}

type DB = IDB.IDBPDatabase<DBSchema>;

let DBInstance: null | DB = null;
const getDB = async () => {
	const DBName = 'translationsHistory';

	if (DBInstance === null) {
		DBInstance = await IDB.openDB<DBSchema>(DBName, 1, {
			upgrade(db) {
				db.createObjectStore('translationsHistory', {
					keyPath: 'id',
					autoIncrement: true,
				});
			},
		});
	}

	return DBInstance;
};

export const addEntry = async (entry: HistoryEntry) => {
	const db = await getDB();
	return db.add('translationsHistory', entry);
};

export const deleteEntry = async (entryId: number) => {
	const db = await getDB();
	return db.delete('translationsHistory', entryId);
};

export const flush = async () => {
	const db = await getDB();
	const transaction = await db.transaction('translationsHistory', 'readwrite');

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

	const transaction = await db.transaction('translationsHistory', 'readonly');

	const entries: IEntryWithKey[] = [];

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
