import browser from 'webextension-polyfill';
import { IDBFactory } from 'fake-indexeddb';

export const wipeIDB = () => {
	indexedDB = new IDBFactory();
};

export const clearAllMocks = async () => {
	wipeIDB();
	localStorage.clear();
	await browser.storage.local.clear();
};
