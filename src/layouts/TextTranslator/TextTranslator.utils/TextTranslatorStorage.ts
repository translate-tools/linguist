import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { decodeStruct, tryDecode, type } from '../../../lib/types';
import { LangCodeWithAuto, LangCode } from '../../../types/runtime';
import { AbstractVersionedStorage } from '../../../types/utils';

const storageSignature = type.union([
	type.type({
		from: LangCodeWithAuto,
		to: LangCode,
		translate: type.union([
			type.type({
				originalText: type.string,
				translatedText: type.union([type.string, type.null]),
			}),
			type.null,
		]),
	}),
	type.null,
]);

export type TextTranslatorData = TypeOf<typeof storageSignature>;

export class TextTranslatorStorage extends AbstractVersionedStorage {
	static publicName = 'TextTranslatorStorage';
	static storageVersion = 3;

	// TODO: wrap it to tool for migrations. It may be a data transforming pipeline or array with cases to execution for complex migrations
	public static async updateStorageVersion(prevVersion: number | null) {
		const storeName = 'TextTranslatorStorage';

		const dataStructureVersions = {
			0: type.union([
				type.type({
					from: LangCodeWithAuto,
					to: LangCode,
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

		// We fall trough cases to migrate from older versions to newer
		switch (prevVersion) {
			case 1: {
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
			}

			case 2: {
				const { [storeName]: tabData } = await browser.storage.local.get(
					storeName,
				);

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
			}
		}
	}

	public readonly storeName = 'TextTranslatorStorage';

	/**
	 * Default data
	 */
	public readonly defaultData: TextTranslatorData = null;

	public getData = async () => {
		const storeName = this.storeName;
		const { [storeName]: tabData } = await browser.storage.local.get(storeName);

		const { defaultData } = this;
		if (tabData !== undefined) {
			return tryDecode(storageSignature, tabData, defaultData);
		} else {
			return defaultData;
		}
	};

	public setData = async (data: TextTranslatorData) => {
		// Verify data
		tryDecode(storageSignature, data);

		const storeName = this.storeName;
		await browser.storage.local.set({ [storeName]: data });
	};

	public updateData = async (data: Partial<TextTranslatorData>) => {
		const actualData = await this.getData();

		// Protect from null
		if (typeof actualData === null) {
			throw new TypeError('Cant merge with null');
		}

		const mergedData = { ...actualData, ...data } as TextTranslatorData;

		return this.setData(mergedData);
	};

	public clear = async () => this.setData(null);

	public forgetText = async () => {
		const data = await this.getData();

		if (data !== null) {
			data.translate = null;
			this.setData(data);
		}
	};
}
