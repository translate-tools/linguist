import { type } from '../../../lib/types';
import { TranslationType } from '../../../types/translation/Translation';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { addEntry } from './data';

export const [addTranslationHistoryEntryFactory, addTranslationHistoryEntry] =
	buildBackendRequest('addTranslationHistoryEntry', {
		requestValidator: type.type({
			translation: TranslationType,
			origin: type.string,
		}),
		responseValidator: type.number,

		factoryHandler: () => (data) => {
			return addEntry({ ...data, timestamp: Date.now() });
		},
	});
