import browser from 'webextension-polyfill';
import { isMobileBrowser } from './browser';

export const getUserLanguage = () => browser.i18n.getUILanguage().split('-')[0];

export const getInternationalizedMessage = <T = null>(
	messageName: string,
	substitutions?: string | string[],
	emptyResult: T = null as any,
) => {
	const text = browser.i18n.getMessage(messageName, substitutions);
	return text.length > 0 ? text : emptyResult;
};

export const isMessageExist = (messageName: string, substitutions?: string | string[]) =>
	getInternationalizedMessage(messageName, substitutions, null) !== null;

export const getMessage = (messageName: string, substitutions?: string | string[]) =>
	getInternationalizedMessage(messageName, substitutions, `*${messageName}`);

export function getLanguageNameByCode(
	langCode: string,
	encodeNotFoundToString?: true,
): string;
export function getLanguageNameByCode(
	langCode: string,
	encodeNotFoundToString: false,
): string | null;
export function getLanguageNameByCode(
	langCode: string,
	encodeNotFoundToString: boolean = true,
) {
	const fixedLangCode = langCode === 'auto' ? 'lang_detect' : `langCode_${langCode}`;
	return encodeNotFoundToString
		? getMessage(fixedLangCode)
		: getInternationalizedMessage(fixedLangCode, undefined, null);
}

export const detectLanguage = async (text: string, reliableOnly = false) => {
	// Language detection is not work on mobile firefox version, so we can't detect language
	// https://github.com/mozilla-mobile/fenix/issues/18633

	// We should await fix or we may use https://github.com/wooorm/franc library, but it's have low precision
	if (isMobileBrowser()) return null;

	return browser.i18n.detectLanguage(text).then((result) => {
		if (reliableOnly && !result.isReliable) {
			return null;
		}

		const sortedLangs = result.languages.sort((a, b) => b.percentage - a.percentage);
		return sortedLangs.length > 0 ? sortedLangs[0].language : null;
	});
};
