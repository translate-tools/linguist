import { buildTabRequest } from '../utils/requestBuilder';

export const [translateSelectedTextFactory, translateSelectedText] = buildTabRequest(
	'translateSelectedText',
	{
		factoryHandler:
			({ selectTranslatorRef }) =>
				async () => {
					const selectTranslator = selectTranslatorRef.value;
					if (selectTranslator === null || !selectTranslator.isRun()) return;

					selectTranslator.translateSelectedText();
				},
	},
);
