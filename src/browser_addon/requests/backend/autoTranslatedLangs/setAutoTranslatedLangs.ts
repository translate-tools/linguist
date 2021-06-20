import { browser } from 'webextension-polyfill-ts';

import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';

import { storeDataSignature } from './getAutoTranslatedLangs';

const setPreferences = async (langs: string[]) => {
	const storageKey = 'autoTranslatedLangs';
	return browser.storage.local.set({ [storageKey]: langs });
};

export const setAutoTranslatedLangs = (langs: string[]): Promise<void> =>
	bgSendRequest('setAutoTranslatedLangs', langs);

export const setAutoTranslatedLangsFactory: RequestHandlerFactory = () => {
	addRequestHandler('setAutoTranslatedLangs', async (rawData) => {
		const langs = tryDecode(storeDataSignature, rawData);
		await setPreferences(langs);
	});
};
