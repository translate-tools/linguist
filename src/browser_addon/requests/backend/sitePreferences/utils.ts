// TODO: keep it in indexDB and show list on options page

import { TypeOf } from 'io-ts';
import { browser } from 'webextension-polyfill-ts';
import { tryDecode, type } from '../../../lib/types';

export type SiteData = TypeOf<typeof dataSignature>;

export const dataSignature = type.type({
	translateAlways: type.boolean,
});

const storageKeyPrefix = 'SitePreferences:';

export const setPreferences = async (site: string, data: SiteData) => {
	const storageKey = storageKeyPrefix + site;
	return browser.storage.local.set({ [storageKey]: data });
};

export const getPreferences = async (site: string) => {
	const storageKey = storageKeyPrefix + site;

	const store = await browser.storage.local.get(storageKey);

	try {
		return tryDecode(dataSignature, store[storageKey]);
	} catch (error) {
		if (error instanceof TypeError) {
			return null;
		} else {
			throw error;
		}
	}
};
