import { buildBackendRequest } from '../../../../lib/requestBuilder';
import { deleteLanguage } from './utils';

export const [deleteLanguagePreferencesFactory, deleteLanguagePreferencesReq] =
	buildBackendRequest('deleteLanguagePreferences', {
		factoryHandler: () => deleteLanguage,
	});

export const deleteLanguagePreferences = (lang: string) =>
	deleteLanguagePreferencesReq(lang);
