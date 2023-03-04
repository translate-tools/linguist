interface TTSProviderProps {
	getTextToSpeakBlob(text: string, language: string): Promise<Blob>;
}

// interface TTSProviderStaticProps {
// 	getSupportedLanguages(): string[];
// }

// type TTSProvider = TTSProviderStaticProps & {
// 	new(...args: any[]): TTSProviderProps;
// };

export class GoogleTTS implements TTSProviderProps {
	getTextToSpeakBlob(text: string, language: string): Promise<Blob> {
		const url =
			`https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=dict-chrome-ex&ttsspeed=0.5&q=` +
			encodeURIComponent(text);

		return fetch(url)
			.then((rsp) => rsp.blob())
			.then((blob) => new Blob([blob], { type: 'audio/mpeg' }));
	}

	getSupportedLanguages() {
		// prettier-ignore
		return [
			"af", "sq", "am", "ar", "hy", "as", "ay", "az", "bm", "eu",
			"be", "bn", "bho", "bs", "bg", "ca", "ceb", "ny", "zh", "zh_HANT",
			"co", "hr", "cs", "da", "dv", "doi", "nl", "en", "eo", "et", "ee",
			"tl", "fi", "fr", "fy", "gl", "ka", "de", "el", "gn", "gu", "ht",
			"ha", "haw", "iw", "hi", "hmn", "hu", "is", "ig", "ilo", "id",
			"ga", "it", "ja", "jw", "kn", "kk", "km", "rw", "gom", "ko",
			"kri", "ku", "ckb", "ky", "lo", "la", "lv", "ln", "lt", "lg",
			"lb", "mk", "mai", "mg", "ms", "ml", "mt", "mi", "mr", "mni-Mtei",
			"lus", "mn", "my", "ne", "no", "or", "om", "ps", "fa", "pl",
			"pt", "pa", "qu", "ro", "ru", "sm", "sa", "gd", "nso", "sr",
			"st", "sn", "sd", "si", "sk", "sl", "so", "es", "su", "sw", "sv",
			"tg", "ta", "tt", "te", "th", "ti", "ts", "tr", "tk", "ak", "uk", "ur",
			"ug", "uz", "vi", "cy", "xh", "yi", "yo", "zu"
		];
	}
}

export class LingvaTTS implements TTSProviderProps {
	private host = 'https://lingva.ml';

	async getTextToSpeakBlob(text: string, language: string): Promise<Blob> {
		return fetch(
			`${this.host}/api/v1/audio/${encodeURIComponent(
				language,
			)}/${encodeURIComponent(text)}`,
		)
			.then((rsp) => rsp.json())
			.then((json: unknown) => {
				if (typeof json !== 'object' || json === null) {
					throw new TypeError('Unexpected response');
				}
				if (!('audio' in json) || !Array.isArray(json.audio)) {
					throw new TypeError('Unexpected response');
				}

				return new Blob([new Uint8Array(json.audio)], { type: 'audio/mpeg' });
			});
	}

	getSupportedLanguages() {
		// prettier-ignore
		return [
			"af", "sq", "am", "ar", "hy", "as", "ay", "az", "bm", "eu",
			"be", "bn", "bho", "bs", "bg", "ca", "ceb", "ny", "zh", "zh_HANT",
			"co", "hr", "cs", "da", "dv", "doi", "nl", "en", "eo", "et", "ee",
			"tl", "fi", "fr", "fy", "gl", "ka", "de", "el", "gn", "gu", "ht",
			"ha", "haw", "iw", "hi", "hmn", "hu", "is", "ig", "ilo", "id",
			"ga", "it", "ja", "jw", "kn", "kk", "km", "rw", "gom", "ko",
			"kri", "ku", "ckb", "ky", "lo", "la", "lv", "ln", "lt", "lg",
			"lb", "mk", "mai", "mg", "ms", "ml", "mt", "mi", "mr", "mni-Mtei",
			"lus", "mn", "my", "ne", "no", "or", "om", "ps", "fa", "pl",
			"pt", "pa", "qu", "ro", "ru", "sm", "sa", "gd", "nso", "sr",
			"st", "sn", "sd", "si", "sk", "sl", "so", "es", "su", "sw", "sv",
			"tg", "ta", "tt", "te", "th", "ti", "ts", "tr", "tk", "ak", "uk", "ur",
			"ug", "uz", "vi", "cy", "xh", "yi", "yo", "zu"
		];
	}
}
