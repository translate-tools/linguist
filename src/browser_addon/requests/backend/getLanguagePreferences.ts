import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';
import { RequestHandlerFactory } from '../types';

export const getLanguagePreferencesOut = type.type({
	userLanguage: type.string,
});

export const getLanguagePreferences = () =>
	bgSendRequest('getLanguagePreferences').then((prefs) =>
		tryDecode(getLanguagePreferencesOut, prefs),
	);

export const requestUserLanguage = () =>
	getLanguagePreferences().then((prefs) => prefs.userLanguage);

export const getLanguagePreferencesFactory: RequestHandlerFactory = ({ cfg }) => {
	addRequestHandler('getLanguagePreferences', async () => {
		const userLanguage = cfg.getConfig('language');
		if (userLanguage === null) {
			throw new Error('Invalid value');
		}

		return {
			userLanguage,
		};
	});
};
