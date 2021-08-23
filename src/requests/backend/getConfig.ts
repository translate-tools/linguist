import { buildBackendRequest } from '../utils/requestBuilder';
import { AppConfig } from '../../types/runtime';

export const [getConfigFactory, getConfig] = buildBackendRequest('getConfig', {
	responseValidator: AppConfig,
	factoryHandler:
		({ cfg }) =>
			async () => {
				const config = await cfg.getAllConfig();

				if (config === null) {
					if (cfg.isLoad()) {
						throw new Error('Config is not initialized');
					} else {
						throw new Error('Config is null by unknown cause');
					}
				}

				return config;
			},
});
