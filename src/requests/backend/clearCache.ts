import { buildBackendRequest } from '../../lib/requestBuilder';

export const [clearCacheFactory, clearCache] = buildBackendRequest('clearCache', {
	factoryHandler:
		({ bg }) =>
			() =>
				bg.clearTranslatorsCache(),
});
