import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { tryDecode } from '../../lib/types';
import { AppConfig } from '../../types/runtime';
import { RequestHandlerFactory } from '../types';

export const getConfigOut = AppConfig;

export const getConfig = () =>
	bgSendRequest('getConfig').then((rawData) => tryDecode(getConfigOut, rawData));

export const getConfigFactory: RequestHandlerFactory = ({ cfg }) => {
	addRequestHandler('getConfig', async () => {
		return cfg.getAllConfig();
	});
};
