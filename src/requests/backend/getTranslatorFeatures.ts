import { buildBackendRequest } from '../../lib/requests/requestBuilder';
import { type } from '../../lib/types';
import { ArrayOfStrings } from '../../types/runtime';

export const [getTranslatorFeaturesFactory, getTranslatorFeatures] = buildBackendRequest(
	'getTranslatorFeatures',
	{
		responseValidator: type.type({
			supportedLanguages: ArrayOfStrings,
			isSupportAutodetect: type.boolean,
		}),

		factoryHandler:
			({ bg }) =>
				async () => {
					const translator = bg.translator;
					if (translator === undefined) {
						throw new Error('Translator is not ready');
					}

					return {
						supportedLanguages: translator.supportedLanguages(),
						isSupportAutodetect: translator.isSupportAutodetect(),
					};
				},
	},
);
