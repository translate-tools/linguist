import { buildBackendRequest } from '../../utils/requestBuilder';

import { flush } from './data';

export const [clearTranslationHistoryFactory, clearTranslationHistory] =
	buildBackendRequest('clearTranslationHistory', {
		factoryHandler: () => flush,
	});
