import { TranslatorsCacheStorage } from '../../app/Background/TranslatorsCacheStorage';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [clearCacheFactory, clearCache] = buildBackendRequest('clearCache', {
	factoryHandler:
		({ backgroundContext }) =>
			async () => {
				const translateManager = await backgroundContext.getTranslateManager();

				// Clear for each module
				const translators = translateManager.getTranslators();
				for (const translatorName in translators) {
					const cache = new TranslatorsCacheStorage(translatorName);
					await cache.clear();
				}
			},
});
