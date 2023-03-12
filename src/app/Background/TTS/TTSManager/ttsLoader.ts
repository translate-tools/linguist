import { TTSProvider } from '@translate-tools/core/tts';

export const loadTTS = (code: string) => {
	const ttsClass = eval(code);

	if (typeof ttsClass !== 'function') {
		throw new TypeError('Type of object must be callable');
	}

	let instance: any;
	try {
		instance = new ttsClass();
	} catch (error) {
		console.error(error);
		throw new Error('Error while create instance of translator');
	}

	// Validate methods
	const requiredMethods = ['getAudioBuffer'];

	requiredMethods.forEach((key) => {
		if (!(key in instance)) {
			throw new TypeError(`Method "${key}" is not defined`);
		}
		if (typeof instance[key] !== 'function') {
			throw new TypeError(`Instance member "${key}" is not a function`);
		}
	});

	// Validate static methods
	const requiredStaticMethods = ['getSupportedLanguages'];
	requiredStaticMethods.forEach((key) => {
		if (!(key in ttsClass)) {
			throw new TypeError(`Static method "${key}" is not defined`);
		}
		if (typeof ttsClass[key] !== 'function') {
			throw new TypeError(`Static member "${key}" is not a function`);
		}
	});

	return ttsClass as TTSProvider;
};

export const tryLoadTTSCode = (code: string) => {
	try {
		const ttsConstructor = loadTTS(code);
		return {
			constructor: ttsConstructor,
			error: null,
		};
	} catch (error) {
		return {
			constructor: null,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
};
