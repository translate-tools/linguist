import { type } from '../../lib/types';
import { buildBackendRequest } from '../utils/requestBuilder';

// TODO: rename to `getTranslatorsNames` and add custom translators
export const [getTranslatorModulesFactory, getTranslatorModules] = buildBackendRequest(
	'getTranslatorModules',
	{
		responseValidator: type.record(type.string, type.string),
		factoryHandler:
			({ translatorModules }) =>
				async () => {
					const modules: Record<string, string> = {};

					for (const key in translatorModules) {
						modules[key] = translatorModules[key].translatorName;
					}

					return modules;
				},
	},
);
