import * as IDB from 'idb/with-async-ittr';
import { isEqual } from 'lodash';
import * as D from 'io-ts/Decoder';
import { isRight } from 'fp-ts/Either';

import { type } from '../../../lib/types';
import { IDBConstructor, configureIDB } from '../../../lib/idb/manager';
import { DeepPartial } from '../../../types/lib';
import { ITranslation, TranslationType } from '../../../types/translation/Translation';

// TODO: move to utils
/**
 * Check second object contains all properties of first object with equal values
 */
const isEqualIntersection = (obj1: any, obj2: any): boolean => {
	// Compare primitive values
	if (typeof obj1 !== 'object' && typeof obj2 !== 'object') {
		return obj1 === obj2;
	}

	const xIsArray = Array.isArray(obj1);
	const yIsArray = Array.isArray(obj2);

	// Compare arrays
	if (xIsArray && yIsArray) {
		return isEqual(obj1, obj2);
	} else if (xIsArray || yIsArray) {
		return false;
	}

	// Compare objects
	return Object.keys(obj1).every((key) => isEqualIntersection(obj1[key], obj2[key]));
};

export type ITranslationEntry = {
	translation: ITranslation;
	timestamp: number;
	translator?: string;
};

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

export type ITranslationEntryWithKey = { key: number; data: ITranslationEntry };

type TranslationsDBSchemeVersions = {
	1: {
		translations: {
			key: number;
			value: any;
		};
	};
	2: {
		translations: {
			key: number;
			value: ITranslationEntry;
			indexes: {
				originalText: string;
			};
		};
	};
};

export type TranslationsDBSchema = IDB.DBSchema & TranslationsDBSchemeVersions[2];

type DB = IDB.IDBPDatabase<TranslationsDBSchema>;

const translationsStoreName = 'translations';

// TODO: test migration from version 1 to 2
// TODO: move migrations to another files
const scheme1: IDBConstructor<IDB.DBSchema & TranslationsDBSchemeVersions[1]> = {
	version: 1,
	apply: (db) => {
		// Create store
		db.createObjectStore('translations', {
			keyPath: 'id',
			autoIncrement: true,
		});
	},
};

const scheme2: IDBConstructor<TranslationsDBSchema> = {
	version: 2,
	apply: async (db, { transaction: tx, migrateFrom }) => {
		const isMigrationNeeded = migrateFrom === 1;

		// Prepare data
		const translations: TranslationsDBSchemeVersions[2]['translations']['value'][] =
			[];
		if (isMigrationNeeded) {
			// TODO: use pipeline and `fold` function: https://github.com/gcanti/io-ts/blob/master/Decoder.md#model
			const translationType = D.struct({
				from: D.string,
				to: D.string,
				text: D.string,
				translate: D.string,
				date: D.number,
			});

			const entries = await tx.objectStore('translations' as any).getAll();
			for (const translation of entries) {
				// Skip invalid data
				if (!isRight(translationType.decode(translation))) {
					continue;
				}

				const { from, to, text, translate, date } = translation;

				translations.push({
					timestamp: date,
					translation: {
						from,
						to,
						originalText: text,
						translatedText: translate,
					},
				});
			}

			db.deleteObjectStore(translationsStoreName);
		}

		// Create store
		const translationsStore = db.createObjectStore(translationsStoreName, {
			keyPath: 'id',
			autoIncrement: true,
		});

		// `keyPath` with `.` separator: https://w3c.github.io/IndexedDB/#inject-key-into-value
		translationsStore.createIndex('originalText', 'translation.originalText', {
			unique: false,
		});

		// Insert data
		if (isMigrationNeeded && translations.length > 0) {
			for (const translation of translations) {
				await translationsStore.add(translation);
			}
		}
	},
};

const constructTranslationsIDB = configureIDB<TranslationsDBSchema>([scheme1, scheme2]);

let DBInstance: null | DB = null;
const getDB = async () => {
	const DBName = 'translations';

	if (DBInstance === null) {
		DBInstance = await IDB.openDB<TranslationsDBSchema>(DBName, 2, {
			upgrade: constructTranslationsIDB,
		});
	}

	return DBInstance;
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
