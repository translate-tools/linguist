import { type } from '../../lib/types';
import { ArrayOfStrings } from '../../types/runtime';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [getTranslatorFeaturesFactory, getTranslatorFeatures] = buildBackendRequest(
	'getTranslatorFeatures',
	{
		responseValidator: type.type({
			supportedLanguages: ArrayOfStrings,
			isSupportAutodetect: type.boolean,
		}),
		factoryHandler:
			({ backgroundContext }) =>
				async () => {
					const translateManager = await backgroundContext.getTranslateManager();
					return translateManager.getTranslatorFeatures();
				},
	},
);
