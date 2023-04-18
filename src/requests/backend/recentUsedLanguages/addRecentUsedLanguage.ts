import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

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
