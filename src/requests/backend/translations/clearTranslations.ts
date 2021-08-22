import { buildBackendRequest } from '../../utils/requestBuilder';
import { flush } from './data';

export const [clearTranslationsFactory, clearTranslations] = buildBackendRequest(
	'clearTranslations',
	{
		factoryHandler: () => flush,
	},
);
