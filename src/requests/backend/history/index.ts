import { joinRequestHandlers } from '../../utils/requestBuilder/buildBackendRequest';

import { addTranslationHistoryEntryFactory } from './addTranslationHistoryEntry';
import { clearTranslationHistoryFactory } from './clearTranslationHistory';
import { deleteTranslationHistoryEntryFactory } from './deleteTranslationHistoryEntry';
import { getTranslationHistoryEntriesFactory } from './getHistoryEntries';

export const historyRequestHandlersFactory = joinRequestHandlers([
	addTranslationHistoryEntryFactory,
	deleteTranslationHistoryEntryFactory,
	clearTranslationHistoryFactory,
	getTranslationHistoryEntriesFactory,
]);
