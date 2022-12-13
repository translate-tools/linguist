import browser from 'webextension-polyfill';
import { ConfigStorageMigration } from '../migrations';

import configVersion1 from './config-v1.json';
import configVersion2 from './config-v2.json';

describe('config migrations', () => {
	test('migrate config v0-v2', async () => {
		// Load data
		localStorage.setItem('config.Main', JSON.stringify(configVersion1));

		// Migrate data
		const currentVersion = ConfigStorageMigration.version;
		await ConfigStorageMigration.migrate(0, currentVersion);

		const { appConfig } = await browser.storage.local.get('appConfig');

		expect(appConfig).toEqual(configVersion2);
		expect(localStorage.getItem('config.Main')).toBeNull();
	});
});
