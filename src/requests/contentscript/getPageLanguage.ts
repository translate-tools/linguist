import { getPageLanguage as getPageLanguageHelper } from '../../lib/browser';
import { type } from '../../lib/types';
import { buildTabRequest } from '../../lib/requestBuilder';

export const [getPageLanguageFactory, getPageLanguage] = buildTabRequest(
	'getPageLanguage',
	{
		responseValidator: type.union([type.string, type.null]),
		factoryHandler:
			({ config }) =>
				async () =>
					getPageLanguageHelper(
						config.pageTranslator.detectLanguageByContent,
						true,
					).then(
						(rsp) =>
						// FIXME: fix types and remove cast
						rsp as any,
					),
	},
);
