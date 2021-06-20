import { defaultConfig } from '../../background';
import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { RequestHandlerFactory } from '../types';

export const resetConfig = (): Promise<void> => bgSendRequest('resetConfig');

export const resetConfigFactory: RequestHandlerFactory = ({ cfg }) => {
	addRequestHandler('resetConfig', async () => cfg.set(defaultConfig));
};
