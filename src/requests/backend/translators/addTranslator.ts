import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import * as db from './data';
import { loadTranslator } from './utils';

export const [addTranslatorFactory, addTranslator] = buildBackendRequest(
	'addTranslator',
	{
		requestValidator: type.type({
			name: type.string,
			code: type.string,
		}),

		factoryHandler: () => async (data) => {
			loadTranslator(data.code);

			await db.addTranslator(data);
		},
	},
);
