import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { getEntries, TranslationEntryWithKeyType } from './data';

export const [getTranslationsFactory, getTranslations] = buildBackendRequest(
	'getTranslations',
	{
		responseValidator: type.array(TranslationEntryWithKeyType),
		factoryHandler: () => () => getEntries(),
	},
);
