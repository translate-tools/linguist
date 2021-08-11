import { addRequestHandler, bgSendRequest } from '../../../../lib/communication';
import { tryDecode, type } from '../../../../lib/types';
import { RequestHandlerFactory } from '../../../types';
import { addLanguage, dataSignature, LanguageInfo } from './utils';

const dataIn = type.type({
	lang: type.string,
	preferences: dataSignature,
});

export const addLanguagePreferences = (
	lang: string,
	preferences: LanguageInfo,
): Promise<void> => bgSendRequest('addLanguagePreferences', { lang, preferences });

export const addLanguagePreferencesFactory: RequestHandlerFactory = () => {
	addRequestHandler('addLanguagePreferences', async (rawData) => {
		const { lang, preferences } = tryDecode(dataIn, rawData);
		await addLanguage(lang, preferences);
	});
};
