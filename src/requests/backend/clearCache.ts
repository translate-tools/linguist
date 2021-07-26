import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { RequestHandlerFactory } from '../types';

export const clearCache = (): Promise<void> => bgSendRequest('clearCache');

export const clearCacheFactory: RequestHandlerFactory = ({ bg }) => {
	addRequestHandler('clearCache', async () => bg.clearTranslatorsCache());
};
