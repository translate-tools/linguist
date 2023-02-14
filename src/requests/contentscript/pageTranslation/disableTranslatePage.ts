import { buildTabRequest } from '../../utils/requestBuilder';

export const [disableTranslatePageFactory, disableTranslatePage] = buildTabRequest(
	'disableTranslatePage',
	{
		factoryHandler:
			({ pageContext }) =>
				async () => {
					const domTranslator = pageContext.getDOMTranslator();
					if (domTranslator !== null) {
						domTranslator.stopTranslate();
					}
				},
	},
);
