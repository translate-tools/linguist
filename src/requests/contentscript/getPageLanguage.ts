import { addRequestHandler, csSendRequest } from '../../lib/communication';
import { detectLanguage } from '../../lib/language';
import { tryDecode, type } from '../../lib/types';
import { ClientRequestHandlerFactory } from '../types';

export const getPageLanguageOut = type.union([type.string, type.null]);

export const getPageLanguage = (tabId: number) =>
	csSendRequest(tabId, 'getPageLanguage').then((language) =>
		tryDecode(getPageLanguageOut, language),
	);

export const getPageLanguageFactory: ClientRequestHandlerFactory = () => {
	addRequestHandler('getPageLanguage', () =>
		detectLanguage(document.body.innerText, true),
	);
};
