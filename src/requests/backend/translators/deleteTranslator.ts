import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import * as db from './data';

export const [deleteTranslatorFactory, deleteTranslator] = buildBackendRequest(
	'deleteTranslator',
	{
		requestValidator: type.number,

		factoryHandler: () => async (translatorId) => {
			await db.deleteTranslator(translatorId);
		},
	},
);
