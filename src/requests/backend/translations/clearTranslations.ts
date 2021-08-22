import { buildBackendRequest } from '../../../lib/requests/requestBuilder';
import { flush } from './data';

export const [clearTranslationsFactory, clearTranslations] = buildBackendRequest(
	'clearTranslations',
	{
		factoryHandler: () => flush,
	},
);
