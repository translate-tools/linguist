import { addRequestHandler, bgSendRequest } from '../../../../lib/communication';
import { tryDecode, type } from '../../../../lib/types';
import { RequestHandlerFactory } from '../../../types';
import { hasAutoTranslatedLang as hasAutoTranslatedLangReq } from '../sitePreferences/utils';

export const hasAutoTranslatedLang = (
	lang: string,
): ReturnType<typeof hasAutoTranslatedLangReq> =>
	bgSendRequest('hasAutoTranslatedLang', lang);

export const hasAutoTranslatedLangFactory: RequestHandlerFactory = () => {
	addRequestHandler('hasAutoTranslatedLang', async (rawData) => {
		const lang = tryDecode(type.string, rawData);
		return hasAutoTranslatedLangReq(lang);
	});
};
