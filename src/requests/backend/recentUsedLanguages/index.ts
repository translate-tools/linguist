import browser from 'webextension-polyfill';

import { decodeStruct, type } from '../../../lib/types';

const storageKey = 'recentUsedLanguages';

const languagesType = type.array(type.string);

// TODO: provide `limitLanguages` argument as option from config
export const getLanguages = async (limitLanguages = 5): Promise<string[]> => {
	const storageSlice = await browser.storage.local.get(storageKey);
	const decodeResult = decodeStruct(languagesType, storageSlice[storageKey]);
	if (decodeResult.errors !== null) return [];

	const languages = decodeResult.data;
	const offset =
		languages.length > limitLanguages ? languages.length - limitLanguages : 0;
	return languages.slice(offset);
};

export const pushLanguage = async (language: string) => {
	const languages = await getLanguages();
	const preparedLanguagesList = languages
		.concat(language)
		.filter((lang, index, array) => array.lastIndexOf(lang) === index);

	await browser.storage.local.set({ [storageKey]: preparedLanguagesList });
};
