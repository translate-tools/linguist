import browser from 'webextension-polyfill';

import { clearAllMocks } from '../../../lib/tests';
import { AppConfigType } from '../../../types/runtime';

import { ConfigStorage, ObservableAsyncStorage } from '../ConfigStorage';
import { ConfigStorageMigration } from '../ConfigStorage.migrations';
import configVersion1 from './config-v1.json';
import configVersion3 from './config-v3.json';
import configVersion6 from './config-v6.json';

const latestVersion = 6;
const latestConfigSample = configVersion6;

describe('config migrations', () => {
	beforeAll(clearAllMocks);

	test('migrate config from v0 to v3', async () => {
		// Load data
		localStorage.setItem('config.Main', JSON.stringify(configVersion1));

		// Migrate data
		await ConfigStorageMigration.migrate(0, 3);

		const { appConfig } = await browser.storage.local.get('appConfig');

		expect(appConfig).toEqual(configVersion3);
		expect(localStorage.getItem('config.Main')).toBeNull();
	});

	test('migrate config v0 to latest version', async () => {
		// Load data
		localStorage.setItem(
			'config.Main',
			JSON.stringify({
				...configVersion1,
				translatorModule: 'BingTranslatorPublic',
			}),
		);

		// Migrate data
		await ConfigStorageMigration.migrate(0, latestVersion);

		const { appConfig } = await browser.storage.local.get('appConfig');
		expect(appConfig).toEqual(latestConfigSample);
	});

	describe(`race condition detection`, () => {
		beforeEach(clearAllMocks);

		for (let attempt = 1; attempt <= 5; attempt++) {
			test(`Detection race conditions. Attempt #${attempt}`, async () => {
				// Load data
				localStorage.setItem(
					'config.Main',
					JSON.stringify({
						...configVersion1,
						translatorModule: 'BingTranslatorPublic',
					}),
				);

				// Migrate part of data
				await ConfigStorageMigration.migrate(0, 5);

				// Migrate another part of data
				await ConfigStorageMigration.migrate(5, latestVersion);

				const { appConfig } = await browser.storage.local.get('appConfig');
				expect(appConfig).toEqual(latestConfigSample);
			});
		}
	});
});

describe('use config', () => {
	beforeAll(clearAllMocks);

	const latestConfigObject = latestConfigSample as AppConfigType;

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
