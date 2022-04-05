import { buildBackendRequest } from '../../utils/requestBuilder';

import { getEntries } from './data';

export const [getTranslatorsFactory, getTranslators] = buildBackendRequest(
	'getTranslators',
	{
		factoryHandler: () => () => getEntries(),
	},
);
