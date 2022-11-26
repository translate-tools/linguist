import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { tryDecode, type } from '../../../lib/types';
import { AbstractVersionedStorage } from '../../../types/utils';

export class PageTranslationStorage extends AbstractVersionedStorage {
	static storageVersion = 1;

	public static readonly storeName = 'PageTranslationStorage';
	public static readonly storageSignature = type.type({
		optionsSpoilerState: type.boolean,
	});

	/**
	 * Default data
	 */
	public static readonly defaultData: TypeOf<
		typeof PageTranslationStorage.storageSignature
	> = {
		optionsSpoilerState: false,
	};

	public static getData = async () => {
		const storeName = PageTranslationStorage.storeName;
		const { [storeName]: tabData } = await browser.storage.local.get(storeName);

		if (tabData !== undefined) {
			return tryDecode(PageTranslationStorage.storageSignature, tabData);
		} else {
			return PageTranslationStorage.defaultData;
		}
	};

	private static setData = async (
		data: TypeOf<typeof PageTranslationStorage.storageSignature>,
	) => {
		// Verify data
		tryDecode(PageTranslationStorage.storageSignature, data);

		const storeName = PageTranslationStorage.storeName;
		await browser.storage.local.set({ [storeName]: data });
	};

	public static updateData = async (
		data: Partial<TypeOf<typeof PageTranslationStorage.storageSignature>>,
	) => {
		const actualData = await PageTranslationStorage.getData();
		const mergedData = Object.assign(actualData, data);

		return PageTranslationStorage.setData(mergedData);
	};
}
