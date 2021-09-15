import { browser } from 'webextension-polyfill-ts';

export const getUserLanguage = () => browser.i18n.getUILanguage().split('-')[0];

export const getMessage = (messageName: string, substitutions?: string | string[]) => {
	const text = browser.i18n.getMessage(messageName, substitutions);
	return text.length > 0 ? text : `*${messageName}`;
};

export const getLanguageNameByCode = (code: string) =>
	getMessage(code === 'auto' ? 'lang_detect' : `langCode_${code}`);

export const detectLanguage = (text: string, reliableOnly = false) =>
	browser.i18n.detectLanguage(text).then((result) => {
		if (reliableOnly && !result.isReliable) {
			return null;
		}

		const sortedLangs = result.languages.sort((a, b) => b.percentage - a.percentage);
		return sortedLangs.length > 0 ? sortedLangs[0].language : null;
	});
