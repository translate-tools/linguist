import browser from 'webextension-polyfill';
import { clearAllMocks } from '../../../lib/tests';
import { TextTranslatorStorage } from './TextTranslatorStorage';

const translatorStorageDataV1 = {
	from: 'en',
	to: 'ja',
	translate: {
		text: 'wanderer in jungle',
		translate: 'ジャングルの放浪者',
	},
} as const;

const expectedData = {
	from: translatorStorageDataV1.from,
	to: translatorStorageDataV1.to,
	translate: {
		originalText: translatorStorageDataV1.translate.text,
		translatedText: translatorStorageDataV1.translate.translate,
	},
} as const;

beforeEach(clearAllMocks);

test('TextTranslatorStorage CRUD operations', async () => {
	const textTranslatorStorage = new TextTranslatorStorage();
	const initData = await textTranslatorStorage.getData();
	expect(initData).toBe(null);

	await textTranslatorStorage.setData(expectedData);

	const dataFromStorage = await textTranslatorStorage.getData();
	expect(dataFromStorage).toEqual(expectedData);
});

describe('textTranslatorStorage migrations', () => {
	test('migration v1', async () => {
		const storeName = 'TextTranslator.lastState';
		const textTranslatorStorage = new TextTranslatorStorage();

		// Write data
		localStorage.setItem(storeName, JSON.stringify(translatorStorageDataV1));

		await TextTranslatorStorage.updateStorageVersion(1);

		// Test clearance
		expect(localStorage.getItem(storeName)).toBe(null);

		// Test migration result
		const actualData = await textTranslatorStorage.getData();
		expect(actualData).toEqual(expectedData);
	});

	test('migration v2', async () => {
		const storeName = 'TextTranslatorStorage';
		const textTranslatorStorage = new TextTranslatorStorage();

		// Write data
		await browser.storage.local.set({
			[storeName]: translatorStorageDataV1,
		});

		await TextTranslatorStorage.updateStorageVersion(2);

		// Test migration result
		const actualData = await textTranslatorStorage.getData();
		expect(actualData).toEqual(expectedData);
	});
});
