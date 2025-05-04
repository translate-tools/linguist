import { TranslatorConstructor } from '@translate-tools/core/translators/Translator';

export const loadTranslator = (code: string) => {
	const translatorClass = eval(code);
	if (typeof translatorClass !== 'function') {
		throw new TypeError('Type of object must be callable');
	}
	let instance: any;
	try {
		instance = new translatorClass();
	} catch (error) {
		console.error(error);
		throw new Error('Error while create instance of translator');
	}
	// Validate methods
	const requiredMethods = ['translate', 'translateBatch', 'getLengthLimit'];
	requiredMethods.forEach((key) => {
		if (!(key in instance)) {
			throw new TypeError(`Translator method "${key}" is not defined`);
		}
		if (typeof instance[key] !== 'function') {
			throw new TypeError(`Translator instance member "${key}" is not a function`);
		}
	});
	// Validate static methods
	const requiredStaticMethods = ['isSupportedAutoFrom', 'getSupportedLanguages'];
	requiredStaticMethods.forEach((key) => {
		if (!(key in translatorClass)) {
			throw new TypeError(`Translator static method "${key}" is not defined`);
		}
		if (typeof translatorClass[key] !== 'function') {
			throw new TypeError(`Translator static member "${key}" is not a function`);
		}
	});
	return translatorClass as TranslatorConstructor;
};
