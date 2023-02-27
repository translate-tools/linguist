import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';
import { pushLanguage } from '.';

export const [addRecentUsedLanguageFactory, addRecentUsedLanguage] = buildBackendRequest(
	'addRecentUsedLanguage',
	{
		requestValidator: type.string,

		factoryHandler: () => async (language) => {
			pushLanguage(language);
		},
	},
);
