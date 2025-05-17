import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { deleteEntry } from './data';
import { notifyDictionaryEntryDelete } from '.';

export const [deleteTranslationFactory, deleteTranslationReq] = buildBackendRequest(
	'deleteTranslation',
	{
		requestValidator: type.number,
		factoryHandler: () => async (id) => {
			await deleteEntry(id);
			notifyDictionaryEntryDelete(id);
		},
	},
);
export const deleteTranslation = (id: number) => deleteTranslationReq(id);
