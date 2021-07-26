import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';
import { EntryWithKey, getEntries } from './data';

const getTranslationsOut = type.array(EntryWithKey);

export const getTranslations = () =>
	bgSendRequest('getTranslations').then((rsp) => tryDecode(getTranslationsOut, rsp));

export const getTranslationsFactory: RequestHandlerFactory = () => {
	addRequestHandler('getTranslations', async () => {
		return getEntries();
	});
};
