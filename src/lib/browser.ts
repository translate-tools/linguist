import { browser } from 'webextension-polyfill-ts';

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
