import browser from 'webextension-polyfill';

import { DEFAULT_TRANSLATOR, DEFAULT_TTS } from '../../config';
import { createMigrationTask, Migration } from '../../lib/migrations/createMigrationTask';

const migrations: Migration[] = [
	{
		version: 1,
		async migrate() {
			const storageKey = 'config.Main';
			const storageDataRaw = localStorage.getItem(storageKey);

			// Skip
			if (storageDataRaw === null) return;

			const storageNameV2 = 'appConfig';

			// Import valid data
			const storageData = JSON.parse(storageDataRaw);
			if (typeof storageData === 'object') {
				// Merge actual data with legacy
				let { [storageNameV2]: actualData } = await browser.storage.local.get(
					storageNameV2,
				);
				if (typeof actualData !== 'object') {
					actualData = {};
				}

				const mergedData = { ...actualData, ...storageData };

				// Write data
				await browser.storage.local.set({
					[storageNameV2]: mergedData,
				});
			}

			// Delete old data
			localStorage.removeItem(storageKey);
		},
	},
	{
		version: 3,
		async migrate() {
			const storageNameV2 = 'appConfig';

			// Merge actual data with old
			let { [storageNameV2]: actualData } = await browser.storage.local.get(
				storageNameV2,
			);
			if (typeof actualData !== 'object') {
				actualData = {};
			}

			const contentscriptPropData =
				actualData?.contentscript?.selectTranslator || {};
			const quickTranslate = actualData?.selectTranslator?.quickTranslate;

			const newData = actualData;
			delete newData.contentscript;

			if (newData.selectTranslator) {
				delete newData.selectTranslator.quickTranslate;
			}

			// Write data
			await browser.storage.local.set({
				[storageNameV2]: {
					...newData,
					selectTranslator: {
						...newData?.selectTranslator,
						...contentscriptPropData,
						mode: quickTranslate
							? 'quickTranslate'
							: newData?.selectTranslator?.mode,
					},
				},
			});
		},
	},
	{
		version: 5,
		async migrate() {
			const storageName = 'appConfig';

			let { [storageName]: actualData } = await browser.storage.local.get(
				storageName,
			);
			if (typeof actualData !== 'object') {
				actualData = {};
			}

			const updatedConfig = {
				ttsModule: DEFAULT_TTS,
				...actualData,
				pageTranslator: {
					enableContextMenu: false,
					toggleTranslationHotkey: null,
					...actualData?.pageTranslator,
				},
			};

			if (actualData.translatorModule === 'BingTranslatorPublic') {
				updatedConfig.translatorModule = DEFAULT_TRANSLATOR;
			}

			// Write data
			await browser.storage.local.set({ [storageName]: updatedConfig });
		},
	},
	{
		// Add history section
		version: 6,
		async migrate() {
			const storageName = 'appConfig';

			let { [storageName]: actualData } = await browser.storage.local.get(
				storageName,
			);
			if (typeof actualData !== 'object') {
				actualData = {};
			}

			const updatedConfig = {
				...actualData,
				history: {
					enabled: true,
				},
			};

			// Write data
			await browser.storage.local.set({ [storageName]: updatedConfig });
		},
	},
];

export const ConfigStorageMigration = createMigrationTask(migrations);
