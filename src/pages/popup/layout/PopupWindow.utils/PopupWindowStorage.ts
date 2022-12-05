import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { tryDecode, type } from '../../../../lib/types';
import { AbstractVersionedStorage } from '../../../../types/VersionedStorage';

const storageStruct = type.type({
	/**
	 * Map where key is tabs set hash and value is active tab ID
	 */
	activeTab: type.record(type.string, type.string),
});

type StorageType = TypeOf<typeof storageStruct>;

export class PopupWindowStorage extends AbstractVersionedStorage {
	public static readonly publicName = 'PopupWindowStorage';
	public static readonly storageVersion = 1;

	// TODO: be sure that `prevVersion` is `null` for first clean run and `0` for case when versions did not used
	// TODO: #181 use library for migrations
	public static async updateStorageVersion(prevVersion: number | null) {
		switch (prevVersion) {
			case 0: {
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
						await new this().setActiveTab(hash, value);
					}

					// Remove
					localStorage.removeItem(key);
				}
			}
		}
	}

	public getActiveTab = async (tabsSetHash: string) => {
		const { activeTab } = await this.getData();

		return tabsSetHash in activeTab ? activeTab[tabsSetHash] : null;
	};

	public setActiveTab = async (tabsSetHash: string, activeTab: string) => {
		const actualData = await this.getData();
		const mergedActiveTab = Object.assign(actualData.activeTab, {
			[tabsSetHash]: activeTab,
		});

		return this.updateData({
			activeTab: mergedActiveTab,
		});
	};

	private readonly storeName = 'PopupWindowStorage';

	/**
	 * Default data
	 */
	private readonly defaultData: StorageType = {
		activeTab: {},
	};

	private getData = async () => {
		const storeName = this.storeName;
		const { [storeName]: tabData } = await browser.storage.local.get(storeName);

		if (tabData !== undefined) {
			return tryDecode(storageStruct, tabData);
		} else {
			return this.defaultData;
		}
	};

	private setData = async (data: StorageType) => {
		// Verify data
		tryDecode(storageStruct, data);

		const storeName = this.storeName;
		await browser.storage.local.set({ [storeName]: data });
	};

	private updateData = async (data: Partial<StorageType>) => {
		const actualData = await this.getData();
		const mergedData = Object.assign(actualData, data);

		return this.setData(mergedData);
	};
}
