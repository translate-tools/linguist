import { RequestHandlerFactory } from '../types';

import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';

import { Translator } from '@translate-tools/core/types/Translator';

export const getTranslatorModulesOut = type.record(type.string, type.string);

export const getTranslatorModules = () =>
	bgSendRequest('getTranslatorModules').then((rawData) =>
		tryDecode(getTranslatorModulesOut, rawData),
	);

export const getTranslatorModulesFactory: RequestHandlerFactory = ({
	translatorModules,
}) => {
	addRequestHandler('getTranslatorModules', async () => {
		const modules: Record<string, string> = {};
		for (const key in translatorModules) {
			modules[key] = (
				translatorModules[key] as unknown as typeof Translator
			).moduleName;
		}

		return modules;
	});
};
