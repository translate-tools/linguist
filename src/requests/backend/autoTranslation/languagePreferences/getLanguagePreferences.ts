import { buildBackendRequest } from '../../../utils/requestBuilder';

import { getLanguage } from './utils';

export const [getLanguagePreferencesFactory, getLanguagePreferencesReq] =
	buildBackendRequest('getLanguagePreferences', {
		factoryHandler: () => getLanguage,
	});

export const getLanguagePreferences = (lang: string) => getLanguagePreferencesReq(lang);
