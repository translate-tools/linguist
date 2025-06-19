import React, { ComponentType, FC, ReactNode } from 'react';
import browser from 'webextension-polyfill';
import { isLanguageCodeISO639v1 } from '@translate-tools/core/languages';

import { isMobileBrowser } from './browser';

export const getUserLanguage = () => browser.i18n.getUILanguage().split('-')[0];
export const getInternationalizedMessage = <T extends unknown = null>(
	messageName: string,
	substitutions?: string | string[],
	emptyResult: T = null as any,
) => {
	const text = browser.i18n.getMessage(messageName, substitutions);
	return text.length > 0 ? text : emptyResult;
};
export const isMessageExist = (messageName: string, substitutions?: string | string[]) =>
	getInternationalizedMessage(messageName, substitutions, null) !== null;
export const getMessage = (
	messageName: string,
	substitutions?: string | string[],
): string => {
	return getInternationalizedMessage(messageName, substitutions, `*${messageName}`);
};
/**
 * Return `ReactFragment` contains localized string as `ReactNode` segments array where slots replaced to a components from map
 */
export const getLocalizedNode = ({
	messageName,
	substitutions,
	slots,
}: {
	messageName: string;
	substitutions?: string | string[];
	slots: Record<string, ComponentType>;
}): ReactNode => {
	const message = getMessage(messageName, substitutions);
	const parser = new DOMParser();
	const dom = parser.parseFromString(message, 'text/html');
	return (
		<>
			{Array.from(dom.body.childNodes).map((node, id) => {
				if (node.nodeType === Node.TEXT_NODE) return node.textContent;
				// Ignore nodes that not are slots
				if (node.nodeType !== Node.ELEMENT_NODE) return undefined;
				if (node.nodeName.toLowerCase() !== 'slot') return undefined;
				// Cast to don't use `instanceof`
				const slot = node as HTMLElement;
				const Component = slots[slot.id];
				if (!Component) return slot.outerHTML;
				return <Component key={id}>{slot.textContent}</Component>;
			})}
		</>
	);
};
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
export const isValidLanguage = (language: string) => isLanguageCodeISO639v1(language);
export const buildLink =
	(url: string): FC =>
		({ children }) =>
			(
				<a href={url} target="_blank" rel="noopener">
					{' '}
					{children}{' '}
				</a>
			);
