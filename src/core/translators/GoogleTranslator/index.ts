import { stringify } from 'query-string';
import { unescape } from 'lodash';

import { langCode, langCodeWithAuto, Translator } from '../../types/Translator';
import { getToken } from './token';

export class GoogleTranslator extends Translator {
	static readonly moduleName = 'GoogleTranslator';

	isSupportAutodetect() {
		return true;
	}

	supportedLanguages(): langCode[] {
		// Supported, but not valid languages ["zh-cn", "zh-tw", 'ceb', 'haw', 'iw', 'hmn', 'jw', 'ma']

		// eslint-disable
		// prettier-ignore
		return [
			'af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bs', 
			'bg', 'ca', 'ny', 'co', 'hr', 'cs', 'da', 'nl', 'en', 'eo', 
			'et', 'tl', 'fi', 'fr', 'fy', 'gl', 'ka', 'de', 'el', 'gu', 
			'ht', 'ha', 'hi', 'hu', 'is', 'ig', 'id', 'ga', 'it', 'ja', 
			'kn', 'kk', 'km', 'ko', 'ku', 'ky', 'lo', 'la', 'lv', 'lt', 
			'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mn', 'my', 
			'ne', 'no', 'ps', 'fa', 'pl', 'pt', 'pa', 'ro', 'ru', 'sm', 
			'gd', 'sr', 'st', 'sn', 'sd', 'si', 'sk', 'sl', 'so', 'es', 
			'su', 'sw', 'sv', 'tg', 'ta', 'te', 'th', 'tr', 'uk', 'ur', 
			'uz', 'vi', 'cy', 'xh', 'yi', 'yo', 'zu', 'zh',
		];
		// eslint-enable
	}

	lengthLimit() {
		return 4000;
	}

	throttleTime() {
		return 300;
	}

	checkLimitExceeding(text: string | string[]) {
		if (Array.isArray(text)) {
			const encodedText = this.encodeForBatch(text).join('');
			const extra = encodedText.length - this.lengthLimit();
			return extra > 0 ? extra : 0;
		} else {
			const extra = text.length - this.lengthLimit();
			return extra > 0 ? extra : 0;
		}
	}

	private readonly langReplacements: Record<string, string> = {
		zh: 'zh-cn',
	};
	private fixLang(lang: langCodeWithAuto) {
		return lang in this.langReplacements ? this.langReplacements[lang] : lang;
	}

	translate(text: string, from: langCodeWithAuto, to: langCode) {
		return getToken(text).then(({ value: tk }) => {
			const apiPath = 'https://translate.google.com/translate_a/single';

			const data = {
				client: 't',
				sl: this.fixLang(from),
				tl: this.fixLang(to),
				hl: this.fixLang(to),
				dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
				ie: 'UTF-8',
				oe: 'UTF-8',
				otf: 1,
				ssel: 0,
				tsel: 0,
				kc: 7,
				q: text,
				tk,
			};

			const url = apiPath + '?' + stringify(data);

			return fetch(url, {
				method: 'GET',
				credentials: 'omit',
				mode: 'no-cors',
				referrerPolicy: 'no-referrer',
			})
				.then((resp) => resp.json())
				.then((rsp) => {
					if (!(rsp instanceof Array) || !(rsp[0] instanceof Array)) {
						throw new Error('Unexpected response');
					}

					const translatedText = rsp[0]
						.map((chunk) =>
							chunk instanceof Array && typeof chunk[0] === 'string'
								? chunk[0]
								: '',
						)
						.join('');

					return translatedText;
				});
		});
	}

	private parser = new DOMParser();
	translateBatch(text: string[], from: langCodeWithAuto, to: langCode) {
		const preparedText = this.encodeForBatch(text);
		return getToken(preparedText.join('')).then(({ value: tk }) => {
			const apiPath = 'https://translate.googleapis.com/translate_a/t';

			const data = {
				anno: 3,
				client: 'te',
				v: '1.0',
				format: 'html',
				sl: this.fixLang(from),
				tl: this.fixLang(to),
				tk,
			};

			const url = apiPath + '?' + stringify(data);
			const body = preparedText
				.map((text) => `&q=${encodeURIComponent(text)}`)
				.join('');

			return fetch(url, {
				method: 'POST',
				credentials: 'omit',
				mode: 'no-cors',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body,
			})
				.then((resp) => resp.json())
				.then((rawResp) => {
					let resp = rawResp;
					if (text.length == 1) {
						// (string | string[])[]
						resp = [rawResp];
					}

					if (!Array.isArray(resp)) {
						throw new Error('Unexpected response');
					}

					const result: (string | undefined)[] = [];

					resp.forEach((chunk) => {
						let translatedText = '';

						if (from === 'auto') {
							// Structure: [translate: string, detectedLanguage: string]
							if (!Array.isArray(chunk) || typeof chunk[0] !== 'string') {
								throw new Error('Unexpected response');
							}

							translatedText = chunk[0];
						} else {
							// Structure: translate: string
							if (typeof chunk !== 'string') {
								throw new Error('Unexpected response');
							}

							translatedText = chunk;
						}

						const simpleMatch = translatedText.match(
							/^<pre><a i="\d+">([\w\W]+)<\/a><\/pre>$/,
						);
						if (simpleMatch !== null) {
							result.push(unescape(simpleMatch[1]));
							return;
						}

						// TODO: Rewrite it with no use `DOMParser` and `querySelectorAll` for use not only in browser environment
						const doc = this.parser.parseFromString(
							translatedText,
							'text/html',
						);

						let translationResult = '';
						Array.from(doc.querySelectorAll('a')).forEach((tag) => {
							// Skip original text nodes
							if (
								tag.parentElement === null ||
								tag.parentElement.localName === 'i'
							)
								return;

							// Fill accumulator
							translationResult += tag.innerHTML;
						});

						if (translationResult.length === 0) {
							// I don't sure why it here. I think it for keep right length of result array
							result.push(undefined);
						} else {
							result.push(translationResult);
						}
					});

					if (result.length !== text.length) {
						throw new Error(
							'Mismatching a lengths of original and translated arrays',
						);
					}

					return result;
				});
		});
	}

	private encodeForBatch(textList: string[]) {
		return textList.map((text, i) => `<pre><a i="${i}">${text}</a></pre>`);
	}
}
