import { buildBackendRequest } from '../utils/requestBuilder';

export const [clearCacheFactory, clearCache] = buildBackendRequest('clearCache', {
	factoryHandler:
		({ bg }) =>
			() =>
				bg.clearTranslatorsCache(),
});
