import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { decodeStruct, tryDecode, type } from '../../../lib/types';
import { LangCodeWithAuto, LangCode } from '../../../types/runtime';
import { AbstractVersionedStorage } from '../../../types/utils';

// TODO: #refactor use not static class. To implement singleton we may export instance of class
export class TextTranslatorStorage extends AbstractVersionedStorage {
	static publicName = 'TextTranslatorStorage';
	static storageVersion = 3;

	public static readonly storeName = 'TextTranslatorStorage';
	public static readonly storageSignature = type.union([
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

	/**
	 * Default data
	 */
	public static readonly defaultData: TypeOf<
		typeof TextTranslatorStorage.storageSignature
	> = null;

	public static getData = async () => {
		const storeName = TextTranslatorStorage.storeName;
		const { [storeName]: tabData } = await browser.storage.local.get(storeName);

		const { defaultData } = TextTranslatorStorage;
		if (tabData !== undefined) {
			return tryDecode(
				TextTranslatorStorage.storageSignature,
				tabData,
				defaultData,
			);
		} else {
			return defaultData;
		}
	};

	public static setData = async (
		data: TypeOf<typeof TextTranslatorStorage.storageSignature>,
	) => {
		// Verify data
		tryDecode(TextTranslatorStorage.storageSignature, data);

		const storeName = TextTranslatorStorage.storeName;
		await browser.storage.local.set({ [storeName]: data });
	};

	public static updateData = async (
		data: Partial<TypeOf<typeof TextTranslatorStorage.storageSignature>>,
	) => {
		const actualData = await TextTranslatorStorage.getData();

		// Protect from null
		if (typeof actualData === null) {
			throw new TypeError('Cant merge with null');
		}

		const mergedData = { ...actualData, ...data } as TypeOf<
			typeof TextTranslatorStorage.storageSignature
		>;

		return TextTranslatorStorage.setData(mergedData);
	};

	public static clear = async () => TextTranslatorStorage.setData(null);

	public static forgetText = async () => {
		const data = await TextTranslatorStorage.getData();

		if (data !== null) {
			data.translate = null;
			TextTranslatorStorage.setData(data);
		}
	};

	// TODO: wrap it to tool for migrations. It may be a data transforming pipeline or array with cases to execution for complex migrations
	public static async updateStorageVersion(prevVersion: number | null) {
		const storeName = TextTranslatorStorage.storeName;

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
}
