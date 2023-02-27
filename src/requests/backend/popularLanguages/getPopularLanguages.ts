import { buildBackendRequest } from '../../utils/requestBuilder';
import { getLanguages } from '.';

export const [getPopularLanguagesFactory, getPopularLanguages] = buildBackendRequest(
	'getPopularLanguages',
	{
		factoryHandler: () => async () => {
			return getLanguages();
		},
	},
);
