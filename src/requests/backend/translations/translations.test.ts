import * as IDB from 'idb/with-async-ittr';

import { clearAllMocks } from '../../../lib/tests';

import * as translationsStore from './data';
import { translationsStoreName } from './data';

// Close IDB and wipe to clear test
beforeEach(() => {
	translationsStore.closeDB();
	clearAllMocks();
});

test('translations data CRUD operations', async () => {
	const translations = Array(5)
		.fill(null)
		.map((_, index) => ({
			timestamp: new Date().getTime(),
			translation: {
				from: 'en',
				to: 'de',
				originalText: 'text ' + (index + 1),
				translatedText: 'text ' + (index + 1),
			},
		}));

	// TODO: report to `fake-indexeddb` bug about concurrent inserting problems
	const identifiers: number[] = [];
	for (const translation of translations) {
		const id = await translationsStore.addEntry(translation);
		identifiers.push(id);
	}

	const expectedIdentifiersList = translations.map((_, index) => index + 1);
	expect(identifiers).toEqual(expectedIdentifiersList);

	const entriesWithKeys = await translationsStore.getEntries(undefined, undefined, {
		order: 'asc',
	});
	expect(typeof entriesWithKeys).toBe('object');
	expect(Array.isArray(entriesWithKeys)).toBe(true);

	// TODO: report to `idb` bug about invalid type of cursor value (not include a key property name)
	// Remove `id` key
	const entries = (entriesWithKeys as any[]).map(
		({ data: { id, ...anotherProps } }) => anotherProps,
	);

	// Check equality with original data
	expect(entries).toEqual(translations);
});

describe('translations data migrations', () => {
	const translationsV1 = Array(5)
		.fill(null)
		.map((_, index) => ({
			from: 'en',
			to: 'de',
			text: 'text ' + (index + 1),
			translate: 'text ' + (index + 1),
			date: new Date().getTime(),
		}));

	const initDBWithVersion1 = async () => {
		// Init DB
		const db = await IDB.openDB<any>(translationsStoreName, 1, {
			upgrade(db) {
				db.createObjectStore('translations', {
					keyPath: 'id',
					autoIncrement: true,
				});
			},
		});

		// Add entries
		for (const translation of translationsV1) {
			await db.add('translations', translation);
		}

		// Close to unlock
		db.close();
	};

	test('migrate from version 1 to latest', async () => {
		await initDBWithVersion1();

		const entriesWithKeys = await translationsStore.getEntries(undefined, undefined, {
			order: 'asc',
		});

		entriesWithKeys.forEach(({ data }, index) => {
			const mappedData = {
				date: data.timestamp,
				from: data.translation.from,
				to: data.translation.to,
				text: data.translation.originalText,
				translate: data.translation.translatedText,
			};

			const originalData = translationsV1[index];
			expect(mappedData).toEqual(originalData);
		});

		expect(entriesWithKeys.length === translationsV1.length);
	});
});
