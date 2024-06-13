import { customTranslatorsApi } from '../../../requests/offscreen/customTranslators';

import { CustomTranslatorController } from './CustomTranslatorController';

export const validateTranslatorCode = async (code: string) => {
	console.log('Call customTranslator.create');
	// TODO: remove translator after check
	await customTranslatorsApi.create({ code });
};

export const getCustomTranslatorClass = async (code: string) => {
	// TODO: remove translator after check
	const meta = await customTranslatorsApi.create({ code });

	return class extends CustomTranslatorController {
		constructor() {
			super(code, meta.info);
		}

		static getSupportedLanguages = () => meta.info.supportedLanguages;
		static isSupportedAutoFrom = () => meta.info.autoFrom;
	};
};
