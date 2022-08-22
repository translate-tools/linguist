import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { EntryWithKey, getEntries } from './data';

export const [getTranslationHistoryEntriesFactory, getTranslationHistoryEntries] =
	buildBackendRequest('getTranslationHistoryEntries', {
		responseValidator: type.array(EntryWithKey),
		factoryHandler: () => () =>
			getEntries().then(
				(entries) =>
					// FIXME: remove this cast
					entries as any,
			),
	});
