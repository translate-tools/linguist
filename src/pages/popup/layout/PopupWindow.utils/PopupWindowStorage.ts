import { TypeOf } from 'io-ts';
import browser from 'webextension-polyfill';

import { decodeStruct, type } from '../../../../lib/types';

const storageStruct = type.type({
	/**
	 * Map where key is tabs set hash and value is active tab ID
	 */
	activeTab: type.record(type.string, type.string),
});

type StorageType = TypeOf<typeof storageStruct>;

export class PopupWindowStorage {
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

		const struct = decodeStruct(storageStruct, tabData);

		return struct.errors ? this.defaultData : struct.data;
	};

	private setData = async (data: StorageType) => {
		const struct = decodeStruct(storageStruct, data);

		if (struct.errors !== null) return;

		const storeName = this.storeName;
		await browser.storage.local.set({ [storeName]: data });
	};

	private updateData = async (data: Partial<StorageType>) => {
		const actualData = await this.getData();
		const mergedData = Object.assign(actualData, data);

		return this.setData(mergedData);
	};
}
