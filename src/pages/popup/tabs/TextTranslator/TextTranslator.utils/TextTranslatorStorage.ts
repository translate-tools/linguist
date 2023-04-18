import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { tryDecode, type } from '../../../../../lib/types';
import { LangCode, LangCodeWithAuto } from '../../../../../types/runtime';

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

export class TextTranslatorStorage {
	private readonly storeName = 'TextTranslatorStorage';

	/**
	 * Default data
	 */
	private readonly defaultData: TextTranslatorData = null;

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
