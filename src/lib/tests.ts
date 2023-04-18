import { IDBFactory } from 'fake-indexeddb';
import browser from 'webextension-polyfill';

export const wipeIDB = () => {
	indexedDB = new IDBFactory();
};

export const clearAllMocks = async () => {
	wipeIDB();
	localStorage.clear();
	await browser.storage.local.clear();
};
