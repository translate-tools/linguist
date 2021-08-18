import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { tryDecode } from '../../lib/types';
import { AppConfig, AppConfigType } from '../../types/runtime';
import { RequestHandlerFactory } from '../types';

export const setConfigIn = AppConfig;

export const setConfig = (config: AppConfigType): Promise<void> =>
	bgSendRequest('setConfig', config);

export const setConfigFactory: RequestHandlerFactory = ({ cfg }) => {
	addRequestHandler('setConfig', async (rawData) => {
		const newConfig = tryDecode(setConfigIn, rawData);
		return cfg.set(newConfig);
	});
};
