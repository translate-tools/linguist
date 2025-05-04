import { type } from '../../../lib/types';
import { TranslationType } from '../../../types/translation/Translation';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { addEntry } from './data';
import { notifyDictionaryEntryAdd } from '.';

export const [addTranslationFactory, addTranslation] = buildBackendRequest(
	'addTranslation',
	{
		requestValidator: TranslationType,
		responseValidator: type.number,
		factoryHandler: () => async (translation) => {
			const id = await addEntry({ translation, timestamp: new Date().getTime() });
			notifyDictionaryEntryAdd(translation);
			return id;
		},
	},
);
