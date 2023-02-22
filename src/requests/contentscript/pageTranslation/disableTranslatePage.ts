import { buildTabRequest } from '../../utils/requestBuilder';

export const [disableTranslatePageFactory, disableTranslatePage] = buildTabRequest(
	'disableTranslatePage',
	{
		factoryHandler:
			({ pageTranslationContext }) =>
				async () => {
					const domTranslator = pageTranslationContext.getDOMTranslator();
					if (domTranslator !== null) {
						domTranslator.stopTranslate();
					}
				},
	},
);
