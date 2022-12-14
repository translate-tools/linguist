import browser from 'webextension-polyfill';

import { decodeStruct, type } from '../../../lib/types';
import {
	configureMigration,
	MigrationObject,
	MigrationTask,
} from '../../../migrations/migrations';

const storeName = 'TextTranslatorStorage';

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

const migrations: MigrationObject[] = [
	{
		version: 1,
		async migrate() {
			const lastState = localStorage.getItem('TextTranslator.lastState');

			// Skip
			if (lastState === null) return;

			// Try decode and write data to a new storage
			try {
				const parsedData = JSON.parse(lastState);
				const codec = decodeStruct(dataStructureVersions[0], parsedData);

				if (codec.errors === null && codec.data !== null) {
					await browser.storage.local.set({ [storeName]: codec.data });
				}
			} catch (error) {
				// Do nothing, because invalid data here it is not our responsibility domain
			}

			// Clear data
			localStorage.removeItem('TextTranslator.lastState');
		},
	},
	{
		version: 2,
		async migrate() {
			const { [storeName]: tabData } = await browser.storage.local.get(storeName);

			const codec = decodeStruct(dataStructureVersions[0], tabData);

			// Skip invalid data
			if (codec.errors !== null || codec.data === null) return;

			const { from, to, translate } = codec.data;
			await browser.storage.local.set({
				[storeName]: {
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

export const TextTranslatorStorageMigration: MigrationTask = {
	version: 3,
	async migrate(prevVersion) {
		const migrate = configureMigration(migrations);
		await migrate({ fromVersion: prevVersion, toVersion: 3 });
	},
};
