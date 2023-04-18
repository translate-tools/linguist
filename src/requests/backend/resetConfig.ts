import { defaultConfig } from '../../config';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [resetConfigFactory, resetConfig] = buildBackendRequest('resetConfig', {
	factoryHandler:
		({ config }) =>
			async () => {
				await config.set(defaultConfig);
			},
});
