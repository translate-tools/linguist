import browser from 'webextension-polyfill';

import { clearAllMocks } from '../../../../lib/tests';
import { TextTranslatorStorageMigration } from '../TextTranslatorStorage.migrations';
import { TextTranslatorStorage } from '../TextTranslatorStorage';

import dataSampleV1 from './TextTranslatorData-v1.sample.json';
import dataSampleV2 from './TextTranslatorData-v2.sample.json';

beforeEach(clearAllMocks);

test('TextTranslatorStorage CRUD operations', async () => {
	const textTranslatorStorage = new TextTranslatorStorage();
	const initData = await textTranslatorStorage.getData();
	expect(initData).toBe(null);

	await textTranslatorStorage.setData(dataSampleV2 as any);

	const dataFromStorage = await textTranslatorStorage.getData();
	expect(dataFromStorage).toEqual(dataSampleV2);
});

describe('textTranslatorStorage migrations', () => {
	test('migration v2', async () => {
		const localStorageName = 'TextTranslator.lastState';

		// Write data
		localStorage.setItem(localStorageName, JSON.stringify(dataSampleV1));

		await TextTranslatorStorageMigration.migrate(0, 2);

		// Test clearance
		expect(localStorage.getItem(localStorageName)).toBe(null);

		// Test migration result
		const browserStorageName = 'TextTranslatorStorage';
		const { [browserStorageName]: actualData } = await browser.storage.local.get(
			browserStorageName,
		);

		expect(actualData).toEqual(dataSampleV1);
	});

	test('migration v3', async () => {
		const browserStorageName = 'TextTranslatorStorage';

		// Write data
		await browser.storage.local.set({
			[browserStorageName]: dataSampleV1,
		});

		await TextTranslatorStorageMigration.migrate(2, 3);

		// Test migration result
		const { [browserStorageName]: actualData } = await browser.storage.local.get(
			browserStorageName,
		);
		expect(actualData).toEqual(dataSampleV2);
	});
});
