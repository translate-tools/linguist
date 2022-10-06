import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import {
	TranslationHistoryEntryWithKeyType,
	getEntries,
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
