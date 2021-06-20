import { browser } from 'webextension-polyfill-ts';

export const getUserLanguage = () => browser.i18n.getUILanguage().split('-')[0];

export const getMessage = (messageName: string, substitutions?: string | string[]) => {
	const text = browser.i18n.getMessage(messageName, substitutions);
	return text.length > 0 ? text : `*${messageName}`;
};

export const detectLanguage = (text: string) =>
	browser.i18n.detectLanguage(text).then((result) => {
		const sortedLangs = result.languages.sort((a, b) => a.percentage - b.percentage);
		return sortedLangs.length > 0 ? sortedLangs[0].language : null;
	});
