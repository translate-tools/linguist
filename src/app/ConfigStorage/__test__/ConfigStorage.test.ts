import browser from 'webextension-polyfill';

import { clearAllMocks } from '../../../lib/tests';
import { AppConfigType } from '../../../types/runtime';

import { ConfigStorage, ObservableAsyncStorage } from '../ConfigStorage';
import { ConfigStorageMigration } from '../ConfigStorage.migrations';

import configVersion1 from './config-v1.json';
import configVersion3 from './config-v3.json';
import configVersion5 from './config-v5.json';

describe('config migrations', () => {
	beforeAll(clearAllMocks);

	test('migrate config v0-v3', async () => {
		// Load data
		localStorage.setItem('config.Main', JSON.stringify(configVersion1));

		// Migrate data
		await ConfigStorageMigration.migrate(0, 3);

		const { appConfig } = await browser.storage.local.get('appConfig');

		expect(appConfig).toEqual(configVersion3);
		expect(localStorage.getItem('config.Main')).toBeNull();
	});

	test('migrate config v0-v5', async () => {
		// Load data
		localStorage.setItem('config.Main', JSON.stringify(configVersion1));

		// Migrate data
		await ConfigStorageMigration.migrate(0, 5);

		const { appConfig } = await browser.storage.local.get('appConfig');
		expect(appConfig).toEqual(configVersion5);
	});
});

describe('use config', () => {
	beforeAll(clearAllMocks);

	const latestConfigObject = configVersion5 as AppConfigType;

	test('config storage set/get', async () => {
		const configStorage = new ConfigStorage(latestConfigObject);

		// Get config
		const config1 = await configStorage.get();
		expect(config1).toEqual(latestConfigObject);

		const newData = { ...config1, translatorModule: 'testTranslator' };
		await configStorage.set(newData);

		const config2 = await configStorage.get();
		expect(config2).toEqual(newData);
	});

	test.skip('observable storage', async () => {
		const configStorage = new ConfigStorage(latestConfigObject);
		const observableConfigStorage = new ObservableAsyncStorage(configStorage);

		// Listen config update
		const $config = await observableConfigStorage.getObservableStore();
		const updateConfigPromise = new Promise<AppConfigType>((res) => {
			$config.updates.watch(res);
		});

		const latestConfig = await configStorage.get();
		await observableConfigStorage.set({ ...latestConfig, language: 'ja' });

		const updatedConfig = await updateConfigPromise;
		expect(updatedConfig.language).toBe('ja');
	});
});
