import { type } from '../../../lib/types';
import { LangCode, LangCodeWithAuto } from '../../../types/runtime';
import { buildTabRequest } from '../../utils/requestBuilder';

export const [enableTranslatePageFactory, enableTranslatePageReq] = buildTabRequest(
	'enableTranslatePage',
	{
		requestValidator: type.type({
			from: LangCodeWithAuto,
			to: LangCode,
		}),

		factoryHandler:
			({ pageTranslationContext }) =>
				async ({ from, to }) => {
					const domTranslator = pageTranslationContext.getDOMTranslator();
					if (domTranslator !== null) {
						domTranslator.translate({ from, to });
					}
				},
	},
);

export const enableTranslatePage = (tabId: number, from: string, to: string) =>
	enableTranslatePageReq(tabId, { from, to });
