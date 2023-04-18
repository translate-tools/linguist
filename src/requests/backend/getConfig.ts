import { AppConfig } from '../../types/runtime';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [getConfigFactory, getConfig] = buildBackendRequest('getConfig', {
	responseValidator: AppConfig,
	factoryHandler:
		({ config }) =>
			async () =>
				config.get(),
});
