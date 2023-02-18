import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { tryDecode, type } from '../../../../../lib/types';

const storageSignature = type.type({
	optionsSpoilerState: type.boolean,
});

type PageTranslationData = TypeOf<typeof storageSignature>;

export class PageTranslationStorage {
	private readonly storeName = 'PageTranslationStorage';

	/**
	 * Default data
	 */
	private readonly defaultData: PageTranslationData = {
		optionsSpoilerState: false,
	};

	public getData = async () => {
		const storeName = this.storeName;
		const { [storeName]: tabData } = await browser.storage.local.get(storeName);

		if (tabData !== undefined) {
			return tryDecode(storageSignature, tabData);
		} else {
			return this.defaultData;
		}
	};

	public setData = async (data: PageTranslationData) => {
		// Verify data
		tryDecode(storageSignature, data);

		const storeName = this.storeName;
		await browser.storage.local.set({ [storeName]: data });
	};

	public updateData = async (data: Partial<PageTranslationData>) => {
		const actualData = await this.getData();
		const mergedData = Object.assign(actualData, data);

		return this.setData(mergedData);
	};
}
