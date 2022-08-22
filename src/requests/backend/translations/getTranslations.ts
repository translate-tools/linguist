import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';
import { TranslationEntryWithKeyType, getEntries } from './data';

export const [getTranslationsFactory, getTranslations] = buildBackendRequest(
	'getTranslations',
	{
		responseValidator: type.array(TranslationEntryWithKeyType),
		factoryHandler: () => () => getEntries(),
	},
);
