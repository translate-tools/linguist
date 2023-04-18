import { buildBackendRequest } from '../../utils/requestBuilder';

import { getLanguages } from '.';

export const [getRecentUsedLanguagesFactory, getRecentUsedLanguages] =
	buildBackendRequest('getRecentUsedLanguages', {
		factoryHandler: () => async () => {
			return getLanguages();
		},
	});
