import browser from 'webextension-polyfill';

import {
	createMigrationTask,
	Migration,
} from '../../../../../lib/migrations/createMigrationTask';
import { decodeStruct, type } from '../../../../../lib/types';

const dataStructureVersions = {
	0: type.union([
		type.type({
			from: type.string,
			to: type.string,
			translate: type.union([
				type.type({
					text: type.string,
					translate: type.union([type.string, type.null]),
				}),
				type.null,
			]),
		}),
		type.null,
	]),
};

const migrations: Migration[] = [
	{
		version: 2,
		async migrate() {
			const localStorageName = 'TextTranslator.lastState';
			const textTranslatorData = localStorage.getItem(localStorageName);

			// Skip
			if (textTranslatorData === null) return;

			// Try decode and write data to a new storage
			try {
				const parsedData = JSON.parse(textTranslatorData);
				const codec = decodeStruct(dataStructureVersions[0], parsedData);

				if (codec.errors === null && codec.data !== null) {
					await browser.storage.local.set({
						TextTranslatorStorage: codec.data,
					});
				}
			} catch (error) {
				// Ignore JSON parsing errors
				if (!(error instanceof SyntaxError)) {
					throw error;
				}
			}

			// Clear data
			localStorage.removeItem(localStorageName);
		},
	},
	{
		version: 3,
		async migrate() {
			const browserStorageName = 'TextTranslatorStorage';
			const { [browserStorageName]: tabData } = await browser.storage.local.get(
				browserStorageName,
			);

			const codec = decodeStruct(dataStructureVersions[0], tabData);

			// Skip invalid data
			if (codec.errors !== null || codec.data === null) return;

			const { from, to, translate } = codec.data;
			await browser.storage.local.set({
				[browserStorageName]: {
					from,
					to,
					translate: translate
						? {
							originalText: translate.text,
							translatedText: translate.translate,
						  }
						: null,
				},
			});
		},
	},
];

export const TextTranslatorStorageMigration = createMigrationTask(migrations);
