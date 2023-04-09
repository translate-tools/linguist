import { detectLanguage, getMessage } from '../language';
import { BatchTranslator } from './frontend';

export class BergamotTranslator {
	static translatorName = getMessage('common_offlineTranslator', 'Bergamot');
	static isRequiredKey = () => false;

	private translator;
	constructor() {
		this.translator = new BatchTranslator();
	}

	translate = async (text: string, from: string, to: string) => {
		if (from === 'auto') {
			const langs = BergamotTranslator.getSupportedLanguages();
			const detectedLanguage = await detectLanguage(text);
			if (
				detectedLanguage !== null &&
				detectedLanguage !== to &&
				langs.includes(detectedLanguage)
			) {
				from = detectedLanguage;
			} else {
				// Use most popular content language or first of list
				const defaultLang =
					to !== 'en' ? 'en' : langs.find((lang) => lang !== to);
				from = defaultLang ?? 'en';
			}
		}

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

	static isSupportedAutoFrom = () => true;

	// prettier-ignore
	static getSupportedLanguages = () => [
		"fr", "en", "it", "pt", "ru", "cs",
		"de", "es", "et", "bg", "uk"
	];
}
