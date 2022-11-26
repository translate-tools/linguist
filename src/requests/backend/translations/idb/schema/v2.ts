import { DBSchema } from 'idb/with-async-ittr';

import { IDBConstructor } from '../../../../../lib/idb/manager';
import { decodeStruct, type } from '../../../../../lib/types';

import { ITranslationEntry } from '../../data';

export type IDBTranslationsSchemaV2 = DBSchema & {
	translations: {
		key: number;
		value: ITranslationEntry;
		indexes: {
			originalText: string;
		};
	};
};

const migration: IDBConstructor<IDBTranslationsSchemaV2> = {
	version: 2,
	apply: async (db, { transaction: tx, migrateFrom }) => {
		const isMigrationNeeded = migrateFrom === 1;

		// Prepare data
		const translations: IDBTranslationsSchemaV2['translations']['value'][] = [];
		if (isMigrationNeeded) {
			const translationType = type.type({
				from: type.string,
				to: type.string,
				text: type.string,
				translate: type.string,
				date: type.number,
			});

			const entries = await tx.objectStore('translations' as any).getAll();
			for (const translation of entries) {
				// Skip invalid data
				const translationCodecResult = decodeStruct(translationType, translation);
				if (translationCodecResult.errors !== null) {
					continue;
				}

				const { from, to, text, translate, date } = translationCodecResult.data;

				translations.push({
					timestamp: date,
					translation: {
						from,
						to,
						originalText: text,
						translatedText: translate,
					},
				});
			}

			db.deleteObjectStore(`translations`);
		}

		// Create store
		const translationsStore = db.createObjectStore(`translations`, {
			keyPath: 'id',
			autoIncrement: true,
		});

		// `keyPath` with `.` separator: https://w3c.github.io/IndexedDB/#inject-key-into-value
		translationsStore.createIndex('originalText', 'translation.originalText', {
			unique: false,
		});

		// Insert data
		if (isMigrationNeeded && translations.length > 0) {
			for (const translation of translations) {
				await translationsStore.add(translation);
			}
		}
	},
};

export default migration;
