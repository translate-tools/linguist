import { buildBackendRequest } from '../utils/requestBuilder';
import { AppConfig } from '../../types/runtime';

export const [getConfigFactory, getConfig] = buildBackendRequest('getConfig', {
	responseValidator: AppConfig,
	factoryHandler:
		({ config }) =>
			async () =>
				config.get(),
});
