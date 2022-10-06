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

		factoryHandler: () => async (data) => {
			const id = await addEntry({ ...data, date: new Date().getTime() });

			notifyDictionaryEntryAdd(data);

			return id;
		},
	},
);
