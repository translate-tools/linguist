import { customTranslatorsApi } from '../../../requests/offscreen/customTranslators';

import { CustomTranslatorController } from './CustomTranslatorController';

export const getTranslatorInfo = async (code: string) => {
	const { id, info } = await customTranslatorsApi.create({ code });
	await customTranslatorsApi.delete({ id });
	return info;
};
export const validateTranslatorCode = async (code: string) => {
	await getTranslatorInfo(code);
};
export const getCustomTranslatorClass = async (code: string, id?: string) => {
	const translatorInfo = await getTranslatorInfo(code);
	return class extends CustomTranslatorController {
		constructor() {
			super(code, { info: translatorInfo, id });
		}
		static getSupportedLanguages = () => translatorInfo.supportedLanguages;
		static isSupportedAutoFrom = () => translatorInfo.autoFrom;
	};
};
