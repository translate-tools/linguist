import { browser } from 'webextension-polyfill-ts';

import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';

export const storeDataSignature = type.array(type.string);

const getLangs = async () => {
	const storageKey = 'autoTranslatedLangs';
	const store = await browser.storage.local.get(storageKey);

	try {
		return tryDecode(storeDataSignature, store[storageKey]);
	} catch (error) {
		if (error instanceof TypeError) {
			return [];
		} else {
			throw error;
		}
	}
};

export const getAutoTranslatedLangs = () =>
	bgSendRequest('getAutoTranslatedLangs').then((rsp) =>
		tryDecode(storeDataSignature, rsp),
	);

export const getAutoTranslatedLangsFactory: RequestHandlerFactory = () => {
	addRequestHandler('getAutoTranslatedLangs', async () => {
		return getLangs();
	});
};
