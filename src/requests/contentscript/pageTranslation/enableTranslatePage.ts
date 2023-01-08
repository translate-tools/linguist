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
			({ $config, pageContext }) =>
				async ({ from, to }) => {
					const domTranslator = pageContext.getDOMTranslator();
					if (domTranslator === null) {
						throw new Error('DOM translator are empty');
					}

					if (domTranslator.isRun()) {
						throw new Error('Page already translated');
					}

					const textTranslator = pageContext.getTextTranslator();
					const config = $config.getState();

					if (
						textTranslator !== null &&
					textTranslator.isRun() &&
					config.selectTranslator.disableWhileTranslatePage
					) {
						textTranslator.stop();
					}

					domTranslator.run(from, to);
				},
	},
);

export const enableTranslatePage = (tabId: number, from: string, to: string) =>
	enableTranslatePageReq(tabId, { from: from as langCodeWithAuto, to: to as langCode });
