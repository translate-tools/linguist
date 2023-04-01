import { BatchTranslator } from '.';

export class BergamotTranslator {
	static translatorName = 'Bergamot - Offline translator';
	static isRequiredKey = () => false;

	private translator;
	constructor() {
		this.translator = new BatchTranslator({}, undefined);
	}

	translate = (text: string, from: string, to: string) => {
		const response = this.translator.translate({
			from,
			to,
			text,
			html: false,
			priority: 0,
		});

		return response.then((response) => response.target.text);
	};

	translateBatch = (texts: string[], from: string, to: string) =>
		Promise.all(texts.map((text) => this.translate(text, from, to)));

	getLengthLimit = () => 4000;
	getRequestsTimeout = () => 300;
	checkLimitExceeding = (text: string) => {
		const textLength = !Array.isArray(text)
			? text.length
			: text.reduce((len, text) => len + text.length, 0);

		return textLength - this.getLengthLimit();
	};

	static isSupportedAutoFrom = () => false;

	// prettier-ignore
	static getSupportedLanguages = () => [
		"en", "ru", "de"
	];
}
