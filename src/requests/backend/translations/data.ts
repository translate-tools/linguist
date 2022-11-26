import * as IDB from 'idb/with-async-ittr';

import { type } from '../../../lib/types';
import { getIDBPlan, ExtractSchemeFromIDBConstructor } from '../../../lib/idb/manager';
import { isEqualIntersection } from '../../../lib/utils';
import { DeepPartial } from '../../../types/utils';

import { ITranslation, TranslationType } from '../../../types/translation/Translation';
import { IDBTranslationSchemes } from './idb/schema';

export type ITranslationEntry = {
	translation: ITranslation;
	timestamp: number;
	translator?: string;
};

export type ITranslationEntryWithKey = { key: number; data: ITranslationEntry };

export const TranslationEntryType = type.intersection([
	type.type({
		translation: TranslationType,
		timestamp: type.number,
	}),
	type.partial({
		translator: type.union([type.string, type.undefined]),
	}),
]);

export const TranslationEntryWithKeyType = type.type({
	key: type.number,
	data: TranslationEntryType,
});

export const translationsStoreName = 'translations';

const translationsIDBPlan = getIDBPlan(IDBTranslationSchemes);

let DBInstance: null | IDB.IDBPDatabase<
	ExtractSchemeFromIDBConstructor<typeof translationsIDBPlan>
> = null;
const getDB = async () => {
	const DBName = 'translations';

	if (DBInstance === null) {
		DBInstance = await IDB.openDB(DBName, translationsIDBPlan.latestVersion, {
			upgrade: translationsIDBPlan.upgrade,
		});
	}

	return DBInstance;
};

export const closeDB = () => {
	if (DBInstance !== null) {
		DBInstance.close();
	}

	DBInstance = null;
};

export const addEntry = async (entry: ITranslationEntry) => {
	const db = await getDB();
	return db.add(translationsStoreName, entry);
};

export const deleteEntry = async (entryId: number) => {
	const db = await getDB();
	return db.delete(translationsStoreName, entryId);
};

export const getEntry = async (entryId: number) => {
	const db = await getDB();
	return db.get(translationsStoreName, entryId);
};

export const deleteEntries = async (entry: ITranslation) => {
	const db = await getDB();
	const transaction = await db.transaction(translationsStoreName, 'readwrite');

	// Delete
	const index = await transaction
		.objectStore(translationsStoreName)
		.index('originalText');
	for await (const cursor of index.iterate(entry.originalText)) {
		const currentEntry = cursor.value;

		const isMatchProps = isEqualIntersection(entry, currentEntry.translation);
		if (isMatchProps) {
			await cursor.delete();
		}
	}

	await transaction.done;
};

export const flush = async () => {
	const db = await getDB();
	const transaction = await db.transaction(translationsStoreName, 'readwrite');

	await transaction.store.delete(IDBKeyRange.lowerBound(0));
	await transaction.done;
};

// TODO: refactor it to use object with options
export const getEntries = async (
	from?: number,
	limit?: number,
	options?: { order: 'desc' | 'asc' },
) => {
	const { order = 'desc' } = options ?? {};

	const db = await getDB();

	const transaction = await db.transaction(translationsStoreName, 'readonly');

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

export const findEntry = async (entryPropsToSearch: DeepPartial<ITranslationEntry>) => {
	const db = await getDB();
	const transaction = await db.transaction(translationsStoreName, 'readonly');

	let result: ITranslationEntryWithKey | null = null;

	const originalText = entryPropsToSearch?.translation?.originalText;
	if (originalText === undefined) {
		throw new Error('Parameter `originalText` is required to search');
	}

	// TODO: search not only by index
	// Find
	const index = await transaction
		.objectStore(translationsStoreName)
		.index('originalText');
	for await (const cursor of index.iterate(originalText)) {
		const currentEntry = cursor.value;

		const isMatchEntryProps = isEqualIntersection(entryPropsToSearch, currentEntry);
		if (isMatchEntryProps) {
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
