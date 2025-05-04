import * as IDB from 'idb/with-async-ittr';

import { StringPatternType, type } from '../../../lib/types';

export type ITranslatorEntry = { name: string; code: string };
export const TranslatorEntry = type.type({
	name: StringPatternType(/[^\s]/),
	code: type.string,
});
export type IEntryWithKey = { key: number; data: ITranslatorEntry };
export interface DBSchema extends IDB.DBSchema {
	translators: { key: number; value: ITranslatorEntry };
}
type DB = IDB.IDBPDatabase<DBSchema>;
let DBInstance: null | DB = null;
const getDB = async () => {
	const DBName = 'translators';
	if (DBInstance === null) {
		DBInstance = await IDB.openDB<DBSchema>(DBName, 1, {
			upgrade(db) {
				db.createObjectStore('translators', { autoIncrement: true });
			},
		});
	}
	return DBInstance;
};
export const addTranslator = async (entry: ITranslatorEntry) => {
	const db = await getDB();
	return db.add('translators', entry);
};
export const deleteTranslator = async (entryId: number) => {
	const db = await getDB();
	return db.delete('translators', entryId);
};
export const updateTranslator = async (id: number, entry: ITranslatorEntry) => {
	const db = await getDB();
	return db.put('translators', entry, id);
};
export const getTranslators = async (options?: {
	from?: number;
	limit?: number;
	order: 'desc' | 'asc';
}) => {
	const { from, limit, order = 'desc' } = options ?? {};
	const db = await getDB();
	const transaction = await db.transaction('translators', 'readonly');
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
			entries.push({ key: cursor.primaryKey, data: cursor.value });
		}
	}
	await transaction.done;
	return entries;
};
