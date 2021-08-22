import { buildBackendRequest } from '../../lib/requests/requestBuilder';

export const [clearCacheFactory, clearCache] = buildBackendRequest('clearCache', {
	factoryHandler:
		({ bg }) =>
			() =>
				bg.clearTranslatorsCache(),
});
