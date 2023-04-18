import { type } from '../../../../lib/types';
import { buildBackendRequest } from '../../../utils/requestBuilder';

import { addLanguage, dataSignature, LanguageInfo } from './utils';

export const [addLanguagePreferencesFactory, addLanguagePreferencesReq] =
	buildBackendRequest('addLanguagePreferences', {
		requestValidator: type.type({
			lang: type.string,
			preferences: dataSignature,
		}),

		factoryHandler:
			() =>
				({ lang, preferences }) =>
					addLanguage(lang, preferences),
	});

export const addLanguagePreferences = (lang: string, preferences: LanguageInfo) =>
	addLanguagePreferencesReq({ lang, preferences });
