import { addRequestHandler, bgSendRequest } from '../../../../lib/communication';
import { tryDecode, type } from '../../../../lib/types';
import { RequestHandlerFactory } from '../../../types';
import { deleteLanguage } from './utils';

export const deleteLanguagePreferences = (lang: string): Promise<void> =>
	bgSendRequest('deleteLanguagePreferences', lang);

export const deleteLanguagePreferencesFactory: RequestHandlerFactory = () => {
	addRequestHandler('deleteLanguagePreferences', async (rawData) => {
		const lang = tryDecode(type.string, rawData);
		await deleteLanguage(lang);
	});
};
