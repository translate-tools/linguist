import { browser } from 'webextension-polyfill-ts';

import { detectLanguage } from './language';

export const injectStyles = (paths: string[], parent?: Node) => {
	paths.forEach((path) => {
		const link = document.createElement('link');
		link.href = browser.runtime.getURL(path);
		link.rel = 'stylesheet';
		(parent !== undefined ? parent : document.head).appendChild(link);
	});
};

export function getPageLanguageFromMeta() {
	const html = document.documentElement;

	const langAttributes = ['lang', 'xml:lang'];
	for (const name of langAttributes) {
		const pageLangRaw = html.getAttribute(name);
		if (pageLangRaw !== null) {
			const match = pageLangRaw.match(/^([a-z]+)(-[a-zA-Z]+)?$/);
			if (match !== null) {
				return match[1];
			}
		}
	}

	return null;
}

/**
 * By default detect lang by meta, but while `detectByContent` is `true` its try detect lang by content
 */
export const getPageLanguage = async (detectByContent = false, reliableOnly = false) => {
	const langFromMeta = getPageLanguageFromMeta();

	// Try detect language by content
	if (langFromMeta === null || detectByContent) {
		const contentLang = await detectLanguage(document.body.innerText, reliableOnly);
		if (contentLang !== null) {
			return contentLang;
		}
	}

	if (langFromMeta !== null) {
		return langFromMeta;
	}

	return undefined;
};
