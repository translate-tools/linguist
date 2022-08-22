import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { TranslationHistoryEntryWithKeyType, getEntries } from './data';

export const [getTranslationHistoryEntriesFactory, getTranslationHistoryEntries] =
	buildBackendRequest('getTranslationHistoryEntries', {
		responseValidator: type.array(TranslationHistoryEntryWithKeyType),
		factoryHandler: () => () => getEntries(),
	});
