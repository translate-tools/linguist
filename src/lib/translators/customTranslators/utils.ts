import browser from 'webextension-polyfill';

import { CustomTranslatorController } from './CustomTranslatorController';

export const validateTranslatorCode = async (code: string) => {
	// TODO: remove translator after check
	await browser.runtime.sendMessage({
		action: 'customTranslator.create',
		data: { code },
	});
};

export const getCustomTranslatorClass = (code: string) => {
	return class extends CustomTranslatorController {
		constructor() {
			super(code);
		}
	};
};
