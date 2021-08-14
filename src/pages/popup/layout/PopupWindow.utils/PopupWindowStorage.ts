import { TypeOf } from 'io-ts';
import { browser } from 'webextension-polyfill-ts';
import { tryDecode, type } from '../../../../lib/types';

// TODO: migrate data from `PopupPage.tabSet#` prefix in `localStorage`
export class PopupWindowStorage {
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
}
