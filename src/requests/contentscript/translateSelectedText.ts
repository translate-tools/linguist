import { buildTabRequest } from '../utils/requestBuilder';

export const [translateSelectedTextFactory, translateSelectedText] = buildTabRequest(
	'translateSelectedText',
	{
		factoryHandler:
			({ pageContext }) =>
				async () => {
					const textTranslator = pageContext.getTextTranslator();
					if (textTranslator === null || !textTranslator.isRun()) return;

					textTranslator.translateSelectedText();
				},
	},
);
