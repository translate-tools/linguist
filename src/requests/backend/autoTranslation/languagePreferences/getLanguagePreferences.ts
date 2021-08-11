import { addRequestHandler, bgSendRequest } from '../../../../lib/communication';
import { tryDecode, type } from '../../../../lib/types';
import { RequestHandlerFactory } from '../../../types';
import { getLanguage } from './utils';

export const getLanguagePreferences = (lang: string): ReturnType<typeof getLanguage> =>
	bgSendRequest('getLanguagePreferences', lang);

export const getLanguagePreferencesFactory: RequestHandlerFactory = () => {
	addRequestHandler('getLanguagePreferences', async (rawData) => {
		const lang = tryDecode(type.string, rawData);
		return getLanguage(lang);
	});
};
