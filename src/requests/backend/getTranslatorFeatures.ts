import { buildBackendRequest } from '../utils/requestBuilder';
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
					const translateManager = await bg.getTranslateManager();
					return translateManager.getTranslatorFeatures();
				},
	},
);
