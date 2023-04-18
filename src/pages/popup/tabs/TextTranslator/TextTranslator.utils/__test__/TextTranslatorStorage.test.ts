import browser from 'webextension-polyfill';

import { clearAllMocks } from '../../../../../../lib/tests';

import { TextTranslatorStorage } from '../TextTranslatorStorage';
import { TextTranslatorStorageMigration } from '../TextTranslatorStorage.migrations';
import dataSampleV1 from './TextTranslatorData-v1.sample.json';
import dataSampleV2 from './TextTranslatorData-v2.sample.json';

describe('TextTranslatorStorage CRUD operations', () => {
	beforeAll(clearAllMocks);

	test('set data', async () => {
		const textTranslatorStorage = new TextTranslatorStorage();

		const initData = await textTranslatorStorage.getData();
		expect(initData).toBeNull();

		await textTranslatorStorage.setData(dataSampleV2 as any);
		const textTranslatorData = await textTranslatorStorage.getData();
		expect(textTranslatorData).toEqual(dataSampleV2);
	});

	test('update data', async () => {
		const textTranslatorStorage = new TextTranslatorStorage();

		await textTranslatorStorage.updateData({ from: 'de', to: 'de' });
		const textTranslatorData = await textTranslatorStorage.getData();
		expect(textTranslatorData).not.toBeNull();
		expect(textTranslatorData?.from).toBe('de');
		expect(textTranslatorData?.to).toBe('de');
		expect(textTranslatorData?.translate).toEqual(dataSampleV2.translate);
	});

	test('clear data', async () => {
		const textTranslatorStorage = new TextTranslatorStorage();

		await textTranslatorStorage.forgetText();
		const textTranslatorData1 = await textTranslatorStorage.getData();
		expect(textTranslatorData1).not.toBeNull();
		expect(textTranslatorData1?.translate).toBeNull();

		await textTranslatorStorage.clear();
		const textTranslatorData2 = await textTranslatorStorage.getData();
		expect(textTranslatorData2).toBeNull();
	});
});

describe('TextTranslatorStorage migrations', () => {
	beforeEach(clearAllMocks);

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
