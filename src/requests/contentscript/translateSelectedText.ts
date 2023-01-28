import { buildTabRequest } from '../utils/requestBuilder';

export const [translateSelectedTextFactory, translateSelectedText] = buildTabRequest(
	'translateSelectedText',
	{
		factoryHandler:
			({ pageContext }) =>
				async () => {
				// TODO: move logic to manager
					const textTranslator = pageContext.getTextTranslator();
					if (textTranslator === null || !textTranslator.isRun()) return;

					textTranslator.translateSelectedText();
				},
	},
);
