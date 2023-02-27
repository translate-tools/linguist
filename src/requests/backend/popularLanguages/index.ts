import browser from 'webextension-polyfill';
import { decodeStruct, type } from '../../../lib/types';

const storageKey = 'popularLanguages';

const languagesType = type.array(type.string);

// TODO: keep any number of languages, and get limited
export const getLanguages = async (): Promise<string[]> => {
	const { [storageKey]: languages } = await browser.storage.local.get(storageKey);

	const decodeResult = decodeStruct(languagesType, languages);
	return decodeResult.errors === null ? decodeResult.data : [];
};

// TODO: provide `limitLanguages` argument as option from config
export const pushLanguage = async (language: string, limitLanguages = 3) => {
	const languages = await getLanguages();

	// Insert language at top of list
	languages.unshift(language);

	const preparedLanguagesList = languages
		.filter((lang, index, array) => array.indexOf(lang) === index)
		.slice(0, limitLanguages);

	await browser.storage.local.set({ [storageKey]: preparedLanguagesList });

	return preparedLanguagesList;
};
