import { AppConfigType } from '../../types/runtime';
import { defaultConfig } from '../../config';

import { ConfigStorage } from '../ConfigStorage/ConfigStorage';
import { Background, translatorModules } from '../Background';
import { sendConfigUpdateEvent } from '../ContentScript';

import { AppThemeControl } from '../../lib/browser/AppThemeControl';
import { toggleTranslateItemInContextMenu } from '../../lib/browser/toggleTranslateItemInContextMenu';
import { StateManager } from '../../lib/StateManager';
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
		const cfg = new ConfigStorage(defaultConfig);
		const bg = new Background(cfg);

		//
		// Handle config updates
		//

		const state = new StateManager<AppConfigType>();

		const appThemeControl = new AppThemeControl();
		state.onUpdate(({ appIcon, scheduler, textTranslator, selectTranslator }) => {
			// Set icon
			state.useEffect(() => {
				appThemeControl.setAppIconPreferences(appIcon);
			}, [appIcon]);

			// Clear cache while disable
			state.useEffect(() => {
				if (!scheduler.useCache) {
					clearCache();
				}
			}, [scheduler.useCache]);

			// Clear TextTranslator state
			const textTranslatorStorage = new TextTranslatorStorage();
			state.useEffect(() => {
				if (!textTranslator.rememberText) {
					// NOTE: it is async operation
					textTranslatorStorage.forgetText();
				}
			}, [textTranslator.rememberText]);

			// Configure context menu
			state.useEffect(() => {
				const { enabled, mode } = selectTranslator;
				const isEnabled = enabled && mode === 'contextMenu';
				toggleTranslateItemInContextMenu(isEnabled);
			}, [selectTranslator]);
		});

		cfg.onUpdate((cfg) => state.update(cfg));

		//
		// Handle first load
		//

		// TODO: move this logic to `Background` class
		bg.onLoad(async () => {
			// Send update event
			cfg.onUpdate(() => {
				sendConfigUpdateEvent();
			});

			// Prevent run it again on other pages, such as options page
			// NOTE: on options page function `resetConfigFactory` is undefined. How it work?
			if (isBackgroundContext()) {
				requestHandlers.forEach((factory) => {
					factory({ cfg, bg, translatorModules: translatorModules as any });
				});
			}
		});
	}
}
