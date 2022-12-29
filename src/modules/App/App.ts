import { defaultConfig } from '../../config';

import { ConfigStorage, ObservableAsyncStorage } from '../ConfigStorage/ConfigStorage';
import { Background, translatorModules } from '../Background';
import { sendConfigUpdateEvent } from '../ContentScript';

import { AppThemeControl } from '../../lib/browser/AppThemeControl';
import { toggleTranslateItemInContextMenu } from '../../lib/browser/toggleTranslateItemInContextMenu';
import { isBackgroundContext } from '../../lib/browser';

import { migrateAll } from '../../migrations/migrationsList';

import { TextTranslatorStorage } from '../../layouts/TextTranslator/TextTranslator.utils/TextTranslatorStorage';

import { clearCache } from '../../requests/backend/clearCache';

import { requestHandlers } from './messages';

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

		//
		// Handle first load
		//

		// TODO: move this logic to `Background` class
		background.onLoad(async () => {
			// Send update event
			$appConfig.watch(() => {
				sendConfigUpdateEvent();
			});

			// Prevent run it again on other pages, such as options page
			// NOTE: on options page function `resetConfigFactory` is undefined. How it work?
			if (isBackgroundContext()) {
				requestHandlers.forEach((factory) => {
					factory({
						config: observableConfig,
						bg: background,
						translatorModules: translatorModules as any,
					});
				});
			}
		});
	}
}
