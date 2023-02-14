import { langCode, langCodeWithAuto } from '@translate-tools/core/types/Translator';

import { buildTabRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';
import { LangCodeWithAuto, LangCode } from '../../../types/runtime';

export const [enableTranslatePageFactory, enableTranslatePageReq] = buildTabRequest(
	'enableTranslatePage',
	{
		requestValidator: type.type({
			from: LangCodeWithAuto,
			to: LangCode,
		}),

		factoryHandler:
			({ pageContext }) =>
				async ({ from, to }) => {
					const domTranslator = pageContext.getDOMTranslator();
					if (domTranslator !== null) {
						domTranslator.translate({ from, to });
					}
				},
	},
);

export const enableTranslatePage = (tabId: number, from: string, to: string) =>
	enableTranslatePageReq(tabId, { from: from as langCodeWithAuto, to: to as langCode });
