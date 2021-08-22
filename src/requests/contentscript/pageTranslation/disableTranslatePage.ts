import { buildTabRequest } from '../../../lib/requests/requestBuilder';

export const [disableTranslatePageFactory, disableTranslatePage] = buildTabRequest(
	'disableTranslatePage',
	{
		factoryHandler:
			({ pageTranslator, selectTranslatorRef }) =>
				async () => {
					if (!pageTranslator.isRun()) {
						throw new Error('Page is not translated');
					}

					const selectTranslator = selectTranslatorRef.value;

					pageTranslator.stop();

					if (selectTranslator !== null && !selectTranslator.isRun()) {
						selectTranslator.start();
					}
				},
	},
);
