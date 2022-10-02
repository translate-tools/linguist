import { buildBackendRequest } from '../../utils/requestBuilder';

import { flush } from './data';
import { notifyDictionaryClear } from '.';

export const [clearTranslationsFactory, clearTranslations] = buildBackendRequest(
	'clearTranslations',
	{
		factoryHandler: () => () => flush().then(notifyDictionaryClear),
	},
);
