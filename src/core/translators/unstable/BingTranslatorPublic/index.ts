import { langCode, langCodeWithAuto, Translator } from '../../../types/Translator';
import { Multiplexor } from '../../../lib/Multiplexor';
import { getConfig } from './getConfig';

/**
 * This translator is very slow for translate page, but may use to translate user input
 */
export class BingTranslatorPublic extends Translator {
	static readonly moduleName = 'BingTranslator (public)';

	isSupportAutodetect() {
		return true;
	}

	supportedLanguages(): langCode[] {
		// eslint-disable
		// prettier-ignore
		return [
			'en', 'ar', 'af', 'bg', 'cy', 'hu', 'vi', 'el', 'da', 'he', 
			'id', 'is', 'es', 'it', 'ca', 'ko', 'ht', 'lv', 'lt', 'mg', 
			'ms', 'mt', 'de', 'nl', 'nb', 'fa', 'pl', 'pt', 'ro', 'ru', 
			'sm', 'sk', 'sl', 'sw', 'ty', 'th', 'ta', 'te', 'to', 'tr', 
			'uk', 'ur', 'fj', 'fi', 'fr', 'hi', 'hr', 'cs', 'sv', 'et', 
			'ja',
		];
		// eslint-enable
	}

	lengthLimit() {
		return 3000;
	}

	throttleTime() {
		return 500;
	}

	checkLimitExceeding(text: string | string[]) {
		if (Array.isArray(text)) {
			const encodedText = this.mtp.encode(
				text.map((text, id) => ({ text, id: '' + id })),
			);
			const extra = encodedText.length - this.lengthLimit();
			return extra > 0 ? extra : 0;
		} else {
			const extra = text.length - this.lengthLimit();
			return extra > 0 ? extra : 0;
		}
	}

	private encodeObject(obj: Record<string, string | number>) {
		return Object.keys(obj)
			.map((key) => {
				return key + '=' + encodeURIComponent(obj[key]);
			})
			.join('&');
	}

	// This fn was copy from toolKit for independentcy
	private findInObj(obj: any, path: Array<number | string>, notFound = undefined) {
		try {
			return path.reduce((x, y) => {
				if (y in x) {
					return x[y];
				} else {
					throw Error('Not found');
				}
			}, obj);
		} catch (e) {
			return notFound;
		}
	}

	async translate(text: string, from: langCodeWithAuto, to: langCode) {
		const fixedFrom = from === 'auto' ? 'auto-detect' : from;

		const { IIG, IID, key, token } = await getConfig();

		return fetch(
			`https://www.bing.com/ttranslatev3?isVertical=1&=&IG=${IIG}&=&IID=${IID}`,
			{
				method: 'POST',
				headers: {
					'Content-type': 'application/x-www-form-urlencoded',
				},
				body:
					'&' +
					this.encodeObject({
						fromLang: fixedFrom,
						to,
						text,
						token,
						key,
					}),
			},
		)
			.then((r) => r.json())
			.then((rsp) => {
				const text = this.findInObj(rsp, [0, 'translations', 0, 'text']);
				if (typeof text === 'string') {
					return text;
				} else {
					if ('StatusCode' in rsp) {
						throw new Error(`Unknown error. Code ${rsp['StatusCode']}`);
					} else {
						throw new Error(`Unknown error`);
					}
				}
			});
	}

	private readonly mtp = new Multiplexor({ tokenStart: '😀', tokenEnd: '😃' });
	translateBatch(text: string[], langFrom: langCodeWithAuto, langTo: langCode) {
		const encodedText = this.mtp.encode(
			text.map((text, id) => ({ text, id: '' + id })),
		);

		return this.translate(encodedText, langFrom, langTo).then((rawTranslate) => {
			const result = Array<string | undefined>(text.length);

			const decodedMap = this.mtp.decode(rawTranslate);
			decodedMap.forEach(({ id, text }) => {
				const index = +id;
				result[index] = text;
			});

			return result;
		});
	}
}
