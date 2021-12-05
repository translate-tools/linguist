import { TranslatorInstance } from '@translate-tools/core/types/Translator';

import { type } from '../../lib/types';
import { buildBackendRequest } from '../utils/requestBuilder';

export const [getTranslatorModulesFactory, getTranslatorModules] = buildBackendRequest(
	'getTranslatorModules',
	{
		responseValidator: type.record(type.string, type.string),
		factoryHandler:
			({ translatorModules }) =>
				async () => {
					const modules: Record<string, string> = {};

					// TODO: fix type for `translatorModules`
					for (const key in translatorModules) {
						modules[key] = (
						translatorModules[key] as unknown as TranslatorInstance
						).translatorName;
					}

					return modules;
				},
	},
);
