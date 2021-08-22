import { buildBackendRequest } from '../../lib/requests/requestBuilder';
import { AppConfig } from '../../types/runtime';

export const [setConfigFactory, setConfig] = buildBackendRequest('setConfig', {
	requestValidator: AppConfig,
	factoryHandler:
		({ cfg }) =>
			async (newConfig) => {
				return cfg.set(newConfig);
			},
});
