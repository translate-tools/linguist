import { TranslatorsCacheStorage } from '../../modules/Background/TranslatorsCacheStorage';
import { buildBackendRequest } from '../utils/requestBuilder';

export const [clearCacheFactory, clearCache] = buildBackendRequest('clearCache', {
	factoryHandler:
		({ bg }) =>
			async () => {
			// Clear for each module
				for (const translatorName in bg.getTranslators()) {
					const cache = new TranslatorsCacheStorage(translatorName);
					await cache.clear();
				}
			},
});
