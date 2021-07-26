import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { RequestHandlerFactory } from '../../types';
import { flush } from './data';

export const clearTranslations = (): Promise<void> => bgSendRequest('clearTranslations');

export const clearTranslationsFactory: RequestHandlerFactory = () => {
	addRequestHandler('clearTranslations', async () => {
		return flush();
	});
};
