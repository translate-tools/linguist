import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { addEntry } from './data';
import { TranslationType } from '../../../types/translation/Translation';

export const [addTranslationFactory, addTranslation] = buildBackendRequest(
	'addTranslation',
	{
		requestValidator: TranslationType,
		responseValidator: type.number,

		factoryHandler: () => (data) => addEntry({ ...data, date: new Date().getTime() }),
	},
);
