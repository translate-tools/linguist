import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { deleteEntry } from './data';

export const [deleteTranslationHistoryEntryFactory, deleteTranslationHistoryEntryReq] =
	buildBackendRequest('deleteTranslationHistoryEntry', {
		requestValidator: type.number,
		factoryHandler: () => (id) => deleteEntry(id),
	});

export const deleteTranslationHistoryEntry = (id: number) =>
	deleteTranslationHistoryEntryReq(id);
