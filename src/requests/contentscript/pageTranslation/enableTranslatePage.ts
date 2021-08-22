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
			({ pageTranslator, selectTranslatorRef, config }) =>
				async ({ from, to }) => {
					if (pageTranslator.isRun()) {
						throw new Error('Page already translated');
					}

					const selectTranslator = selectTranslatorRef.value;

					if (
						selectTranslator !== null &&
					selectTranslator.isRun() &&
					config.contentscript.selectTranslator.disableWhileTranslatePage
					) {
						selectTranslator.stop();
					}

					pageTranslator.run(from, to);
				},
	},
);

export const enableTranslatePage = (tabId: number, from: string, to: string) =>
	enableTranslatePageReq(tabId, { from: from as langCodeWithAuto, to: to as langCode });
