import { type } from '../../lib/types';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [getUserLanguagePreferencesFactory, getUserLanguagePreferences] =
	buildBackendRequest('getUserLanguagePreferences', {
		responseValidator: type.string,
		factoryHandler:
			({ config }) =>
				async () => {
					const { language } = await config.get();
					return language;
				},
	}); // hscii
