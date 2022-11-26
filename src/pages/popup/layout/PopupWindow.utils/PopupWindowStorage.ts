import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { tryDecode, type } from '../../../../lib/types';
import { AbstractVersionedStorage } from '../../../../types/utils';

export class PopupWindowStorage extends AbstractVersionedStorage {
	static publicName = 'PopupWindowStorage';
	static storageVersion = 1;

	public static readonly storeName = 'PopupWindowStorage';
	public static readonly storageSignature = type.type({
		/**
		 * Map where key is tabs set hash and value is active tab ID
		 */
		activeTab: type.record(type.string, type.string),
	});

	/**
	 * Default data
	 */
	public static readonly defaultData: TypeOf<
		typeof PopupWindowStorage.storageSignature
	> = {
		activeTab: {},
	};

	public static getData = async () => {
		const storeName = PopupWindowStorage.storeName;
		const { [storeName]: tabData } = await browser.storage.local.get(storeName);

		if (tabData !== undefined) {
			return tryDecode(PopupWindowStorage.storageSignature, tabData);
		} else {
			return PopupWindowStorage.defaultData;
		}
	};

	private static setData = async (
		data: TypeOf<typeof PopupWindowStorage.storageSignature>,
	) => {
		// Verify data
		tryDecode(PopupWindowStorage.storageSignature, data);

		const storeName = PopupWindowStorage.storeName;
		await browser.storage.local.set({ [storeName]: data });
	};

	public static updateData = async (
		data: Partial<TypeOf<typeof PopupWindowStorage.storageSignature>>,
	) => {
		const actualData = await PopupWindowStorage.getData();
		const mergedData = Object.assign(actualData, data);

		return PopupWindowStorage.setData(mergedData);
	};

	public static getActiveTab = async (tabsSetHash: string) => {
		const { activeTab } = await PopupWindowStorage.getData();

		return tabsSetHash in activeTab ? activeTab[tabsSetHash] : null;
	};

	public static setActiveTab = async (tabsSetHash: string, activeTab: string) => {
		const actualData = await PopupWindowStorage.getData();
		const mergedActiveTab = Object.assign(actualData.activeTab, {
			[tabsSetHash]: activeTab,
		});

		return PopupWindowStorage.updateData({
			activeTab: mergedActiveTab,
		});
	};

	public static async updateStorageVersion() {
		// Migrate data from `localStorage`
		const keyPrefix = 'PopupPage.tabSet#';
		for (const key of Object.keys(localStorage)) {
			// Skip not match keys
			if (!key.startsWith(keyPrefix)) continue;

			// Copy
			const value = localStorage.getItem(key);
			if (typeof value === 'string') {
				// Cut prefix to get hash from key
				const hash = key.slice(keyPrefix.length);

				// Write data
				await PopupWindowStorage.setActiveTab(hash, value);
			}

			// Remove
			localStorage.removeItem(key);
		}
	}
}
