import { customTranslatorsApi } from '../../../requests/offscreen/customTranslators';

import { CustomTranslatorController } from './CustomTranslatorController';

export const validateTranslatorCode = async (code: string) => {
	console.log('Call customTranslator.create');
	// TODO: remove translator after check
	await customTranslatorsApi.create({ code });
};

export const getCustomTranslatorClass = (code: string) => {
	return class extends CustomTranslatorController {
		constructor() {
			super(code);
		}
	};
};
