import { buildBackendRequest } from '../../lib/requests/requestBuilder';
import { type } from '../../lib/types';

export const [getUserLanguagePreferencesFactory, getUserLanguagePreferences] =
	buildBackendRequest('getUserLanguagePreferences', {
		responseValidator: type.string,

		factoryHandler:
			({ cfg }) =>
				async () => {
					const userLanguage = await cfg.getConfig('language');

					if (userLanguage === null) {
						throw new Error('Invalid value');
					}

					return userLanguage;
				},
	});
