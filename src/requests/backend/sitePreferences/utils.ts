// TODO: keep it in indexDB and show list on options page

import { TypeOf } from 'io-ts';
import { browser } from 'webextension-polyfill-ts';
import { tryDecode, type } from '../../../lib/types';

export type SiteData = TypeOf<typeof dataSignature>;

// TODO: migrate data from `translateAlways`
export const dataSignature = type.type({
	/**
	 * While `false`, auto translate will not work, while `true` will work with consider other options
	 */
	enableAutoTranslate: type.boolean,

	/**
	 * While size greater than 0, page language code must be in array
	 */
	autoTranslateLanguages: type.array(type.string),
});

const storageKeyPrefix = 'SitePreferences:';

export const setPreferences = async (site: string, options: SiteData) => {
	const storageKey = storageKeyPrefix + site;
	return browser.storage.local.set({ [storageKey]: options });
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
