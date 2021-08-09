import { addRequestHandler, bgSendRequest } from '../../../../lib/communication';
import { tryDecode, type } from '../../../../lib/types';
import { RequestHandlerFactory } from '../../../types';
import { addLanguage } from './utils';

export const addAutoTranslatedLang = (lang: string): Promise<void> =>
	bgSendRequest('addAutoTranslatedLang', lang);

export const addAutoTranslatedLangFactory: RequestHandlerFactory = () => {
	addRequestHandler('addAutoTranslatedLang', async (rawData) => {
		const lang = tryDecode(type.string, rawData);
		await addLanguage(lang);
	});
};
