import { buildBackendRequest } from '../utils/requestBuilder';
import { type } from '../../lib/types';

export const [getUserLanguagePreferencesFactory, getUserLanguagePreferences] =
	buildBackendRequest('getUserLanguagePreferences', {
		responseValidator: type.string,

		factoryHandler:
			({ config }) =>
				async () => {
					const { language } = await config.get();
					return language;
				},
	});
