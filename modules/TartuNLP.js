/**
 * Homepage: https://github.com/TartuNLP/translation-api
 * Demo: https://translate.ut.ee/
 * API docs: https://api.tartunlp.ai/translation/docs
 */
class TartuNLP {
	translate = (text, from, to) => {
		return fetch('https://api.tartunlp.ai/translation/v2', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ text, src: from, tgt: to }),
		})
			.then((r) => r.json())
			.then((r) => r.result);
	};

	translateBatch = (texts, from, to) =>
		Promise.all(texts.map((text) => this.translate(text, from, to)));

	getLengthLimit = () => 5000;
	getRequestsTimeout = () => 300;
	checkLimitExceeding = (text) => {
		const textLength = !Array.isArray(text)
			? text.length
			: text.reduce((len, text) => len + text.length, 0);

		return textLength - this.getLengthLimit();
	};

	static isSupportedAutoFrom = () => false;

	// prettier-ignore
	static getSupportedLanguages = () => [
		"en", "et", "de", "lt", "lv",
		"fi", "ru", "no", "hu", "se",
	];
}

TartuNLP;
