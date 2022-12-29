import { defaultConfig } from '../../config';

import { ConfigStorage, ObservableAsyncStorage } from '../ConfigStorage/ConfigStorage';
import { Background } from '../Background';

import { AppThemeControl } from '../../lib/browser/AppThemeControl';
import { toggleTranslateItemInContextMenu } from '../../lib/browser/toggleTranslateItemInContextMenu';

import { migrateAll } from '../../migrations/migrationsList';

import { TextTranslatorStorage } from '../../layouts/TextTranslator/TextTranslator.utils/TextTranslatorStorage';

import { clearCache } from '../../requests/backend/clearCache';

/**
 * Class that contains app context
 */
export class App {
	async start() {
		// Migrate data
		await migrateAll();

		// Run application
		const config = new ConfigStorage(defaultConfig);
		const observableConfig = new ObservableAsyncStorage(config);

		const background = new Background(observableConfig);
		background.start();

		//
		// Handle config updates
		//
		const $appConfig = await observableConfig.getObservableStore();

		// Update icon
		const appThemeControl = new AppThemeControl();
		$appConfig
			.map((config) => config.appIcon)
			.watch((appIcon) => {
				appThemeControl.setAppIconPreferences(appIcon);
			});

		// Clear cache while disable
		$appConfig
			.map((config) => config.scheduler.useCache)
			.watch((useCache) => {
				if (!useCache) {
					clearCache();
				}
			});

		// Clear TextTranslator state
		const textTranslatorStorage = new TextTranslatorStorage();
		$appConfig
			.map((config) => config.textTranslator.rememberText)
			.watch((rememberText) => {
				if (!rememberText) {
					textTranslatorStorage.forgetText();
				}
			});

		// Configure context menu
		$appConfig
			.map((config) => config.selectTranslator)
			.watch((selectTranslator) => {
				const { enabled, mode } = selectTranslator;
				const isEnabled = enabled && mode === 'contextMenu';
				toggleTranslateItemInContextMenu(isEnabled);
			});
	}
}
