import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import * as db from './data';
import { loadTranslator } from './utils';

export const [updateTranslatorFactory, updateTranslator] = buildBackendRequest(
	'updateTranslator',
	{
		requestValidator: type.type({
			id: type.number,
			translator: type.type({
				name: type.string,
				code: type.string,
			}),
		}),

		factoryHandler:
			() =>
				async ({ id, translator }) => {
					loadTranslator(translator.code);

					await db.updateTranslator(id, translator);
				},
	},
);
