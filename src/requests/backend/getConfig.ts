import { buildBackendRequest } from '../../lib/requestBuilder';
import { AppConfig } from '../../types/runtime';

export const [getConfigFactory, getConfig] = buildBackendRequest('getConfig', {
	responseValidator: AppConfig,
	factoryHandler:
		({ cfg }) =>
			async () => {
			// FIXME: remove cast and fix types
				return cfg.getAllConfig() as any;
			},
});
