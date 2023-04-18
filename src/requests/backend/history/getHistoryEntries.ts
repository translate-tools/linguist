import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

import {
	getEntries,
	TranslationHistoryEntryWithKeyType,
	TranslationHistoryFetcherOptions,
} from './data';

export const [getTranslationHistoryEntriesFactory, getTranslationHistoryEntries] =
	buildBackendRequest('getTranslationHistoryEntries', {
		responseValidator: type.array(TranslationHistoryEntryWithKeyType),
		factoryHandler:
			() =>
				(options: TranslationHistoryFetcherOptions = {}) =>
					getEntries(options),
	});
