import { ClientRequestHandlerFactory } from '../types';

import { getPageLanguage as getPageLanguageHelper } from '../../lib/browser';
import { addRequestHandler, csSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';

export const getPageLanguageOut = type.union([type.string, type.null]);

export const getPageLanguage = (tabId: number) =>
	csSendRequest(tabId, 'getPageLanguage').then((language) =>
		tryDecode(getPageLanguageOut, language),
	);

export const getPageLanguageFactory: ClientRequestHandlerFactory = ({ config }) => {
	addRequestHandler('getPageLanguage', () =>
		getPageLanguageHelper(config.pageTranslator.detectLanguageByContent, true),
	);
};
