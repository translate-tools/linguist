import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';
import { RequestHandlerFactory } from '../types';

export const getLanguagePreferencesOut = type.string;

export const getUserLanguagePreferences = () =>
	bgSendRequest('getUserLanguagePreferences').then((rawData) =>
		tryDecode(getLanguagePreferencesOut, rawData),
	);

export const getUserLanguagePreferencesFactory: RequestHandlerFactory = ({ cfg }) => {
	addRequestHandler('getUserLanguagePreferences', async () => {
		const userLanguage = await cfg.getConfig('language');

		if (userLanguage === null) {
			throw new Error('Invalid value');
		}

		return userLanguage;
	});
};
