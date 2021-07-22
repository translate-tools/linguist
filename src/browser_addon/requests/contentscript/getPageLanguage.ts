import { browser } from 'webextension-polyfill-ts';
import { addRequestHandler, csSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';
import { ClientRequestHandlerFactory } from '../types';

export const getPageLanguageOut = type.union([type.string, type.null]);

export const getPageLanguage = (tabId: number) =>
	csSendRequest(tabId, 'getPageLanguage').then((language) =>
		tryDecode(getPageLanguageOut, language),
	);

export const getPageLanguageFactory: ClientRequestHandlerFactory = () => {
	addRequestHandler('getPageLanguage', () =>
		browser.i18n.detectLanguage(document.body.innerText).then((rsp) => {
			if (!rsp.isReliable) {
				return null;
			}

			return rsp.languages[0].language;
		}),
	);
};
