import browser from 'webextension-polyfill';
import { ConfigStorageMigration } from '../migrations';

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
