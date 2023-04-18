import { AppConfig } from '../../types/runtime';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [setConfigFactory, setConfig] = buildBackendRequest('setConfig', {
	requestValidator: AppConfig,
	factoryHandler:
		({ config }) =>
			async (newConfig) => {
				await config.set(newConfig);
			},
});
