import { CustomTranslator } from '.';
import { buildBackendRequest } from '../../utils/requestBuilder';

import * as db from './data';

export const [getTranslatorsFactory, getTranslators] = buildBackendRequest(
	'getTranslators',
	{
		factoryHandler: () => (): Promise<CustomTranslator[]> =>
			db
				.getTranslators({ order: 'asc' })
				.then((translators) =>
					translators.map(({ key: id, data }) => ({ id, ...data })),
				),
	},
);
