import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { deleteEntry } from './data';

export const [deleteTranslatorFactory, deleteTranslator] = buildBackendRequest(
	'deleteTranslator',
	{
		requestValidator: type.number,

		factoryHandler: () => async (translatorId) => {
			await deleteEntry(translatorId);
		},
	},
);
