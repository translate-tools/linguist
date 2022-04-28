import { buildBackendRequest } from '../../utils/requestBuilder';

import * as db from './data';

export const [getTranslatorsFactory, getTranslators] = buildBackendRequest(
	'getTranslators',
	{
		factoryHandler: () => () => db.getTranslators({ order: 'asc' }),
	},
);
