import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { addEntry } from './data';
import { TranslationType } from '../../../types/translation/Translation';
import { notifyDictionaryEntryAdd } from '.';

export const [addTranslationFactory, addTranslation] = buildBackendRequest(
	'addTranslation',
	{
		requestValidator: TranslationType,
		responseValidator: type.number,

		factoryHandler: () => async (translation) => {
			const id = await addEntry({
				translation,
				timestamp: new Date().getTime(),
			});

			notifyDictionaryEntryAdd(translation);

			return id;
		},
	},
);
