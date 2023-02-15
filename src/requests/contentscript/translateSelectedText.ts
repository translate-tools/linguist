import { buildTabRequest } from '../utils/requestBuilder';

export const [translateSelectedTextFactory, translateSelectedText] = buildTabRequest(
	'translateSelectedText',
	{
		factoryHandler:
			({ pageTranslationContext }) =>
				async () => {
					const textTranslator = pageTranslationContext.getTextTranslator();
					if (textTranslator !== null) {
						textTranslator.translateSelectedText();
					}
				},
	},
);
