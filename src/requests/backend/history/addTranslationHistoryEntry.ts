import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { addEntry } from './data';

export const [addTranslationHistoryEntryFactory, addTranslationHistoryEntry] =
	buildBackendRequest('addTranslationHistoryEntry', {
		requestValidator: type.type({
			translation: type.type({
				from: type.string,
				to: type.string,
				text: type.string,
				translate: type.string,
			}),
			origin: type.string,
		}),
		responseValidator: type.number,

		factoryHandler: () => (data) => addEntry({ ...data, timestamp: Date.now() }),
	});
