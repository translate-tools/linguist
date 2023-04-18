import { getPageLanguage as getPageLanguageHelper } from '../../lib/browser';
import { type } from '../../lib/types';

import { buildTabRequest } from '../utils/requestBuilder';

export const [getPageLanguageFactory, getPageLanguage] = buildTabRequest(
	'getPageLanguage',
	{
		responseValidator: type.union([type.string, type.null]),
		factoryHandler:
			({ $config }) =>
				async () =>
					getPageLanguageHelper(
						$config.getState().pageTranslator.detectLanguageByContent,
						true,
					),
	},
);
