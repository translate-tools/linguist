import { defaultConfig } from '../../config';
import { buildBackendRequest } from '../../lib/requests/requestBuilder';

export const [resetConfigFactory, resetConfig] = buildBackendRequest('resetConfig', {
	factoryHandler:
		({ cfg }) =>
			async () => {
				cfg.set(defaultConfig);
			},
});
