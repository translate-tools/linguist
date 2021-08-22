import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { deleteEntry } from './data';

export const [deleteTranslationFactory, deleteTranslationReq] = buildBackendRequest(
	'deleteTranslation',
	{
		requestValidator: type.number,
		factoryHandler: () => (id) => deleteEntry(id),
	},
);

export const deleteTranslation = (id: number) => deleteTranslationReq(id);
