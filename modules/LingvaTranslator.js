/**
 * Homepage: https://github.com/thedaviddelta/lingva-translate
 * Public instances list: https://github.com/thedaviddelta/lingva-translate#instances
 * Demo: https://lingva.ml/
 * API docs: https://github.com/thedaviddelta/lingva-translate#public-apis
 */
class LingvaTranslator {
	// URL of your instance of LingvaTranslate
	apiPath = 'https://lingva.ml';

	translate = (text, from, to) => {
		return fetch(`${this.apiPath}/api/v1/${from}/${to}/${text}`, {
			credentials: 'omit',
			headers: {
				'User-Agent':
					'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:99.0) Gecko/20100101 Firefox/99.0',
				Accept: '*/*',
				'Accept-Language': 'en-US,en;q=0.5',
				'Sec-Fetch-Dest': 'empty',
				'Sec-Fetch-Mode': 'cors',
				'Sec-Fetch-Site': 'same-origin',
			},
			method: 'GET',
			mode: 'cors',
		})
			.then((r) => r.json())
			.then(({ translation }) => translation);
	};

	translateBatch = (texts, from, to) =>
		Promise.all(texts.map((text) => this.translate(text, from, to)));

	getLengthLimit = () => 4000;
	getRequestsTimeout = () => 300;
	checkLimitExceeding = (text) => {
		const textLength = !Array.isArray(text)
			? text.length
			: text.reduce((len, text) => len + text.length, 0);

		return textLength - this.getLengthLimit();
	};

	static isSupportedAutoFrom = () => true;

	// prettier-ignore
	static getSupportedLanguages = () => [
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

LingvaTranslator;
