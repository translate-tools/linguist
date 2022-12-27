import browser from 'webextension-polyfill';

import { clearAllMocks } from '../../../lib/tests';
import { AppConfigType } from '../../../types/runtime';

import { ConfigStorage, ObservableConfigStorage } from '../ConfigStorage';
import { ConfigStorageMigration } from '../ConfigStorage.migrations';

import configVersion1 from './config-v1.json';
import configVersion3 from './config-v3.json';

describe('config migrations', () => {
	test('migrate config v0-v3', async () => {
		// Load data
		localStorage.setItem('config.Main', JSON.stringify(configVersion1));

		// Migrate data
		await ConfigStorageMigration.migrate(0, 3);

		const { appConfig } = await browser.storage.local.get('appConfig');

		expect(appConfig).toEqual(configVersion3);
		expect(localStorage.getItem('config.Main')).toBeNull();
	});
});

describe('use config', () => {
	beforeAll(clearAllMocks);

	test('load config', async () => {
		const configStorage = new ConfigStorage(configVersion3 as AppConfigType);
		const observableConfigStorage = new ObservableConfigStorage(configStorage);

		// Get config
		const config1 = await configStorage.get();
		expect(config1).toEqual(configVersion3);
		expect(config1?.scheduler).toEqual(configVersion3.scheduler);

		// Get config by key
		const { scheduler: schedulerConfig } = await configStorage.get();
		expect(schedulerConfig).toEqual(configVersion3.scheduler);

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
