import { langCode, Translator } from '../../types/Translator';
import { Multiplexor } from '../../lib/Multiplexor';

/**
 * This module did not test too ago
 */
export class ReversoTranslator extends Translator {
	static readonly moduleName = 'ReversoTranslator (public)';

	isSupportAutodetect() {
		return false;
	}

	supportedLanguages(): langCode[] {
		// eslint-disable
		// prettier-ignore
		return [
			'en', 'ar', 'nl', 'he', 'es', 'it', 'zh', 'de', 'pl', 'pt',
			'ro', 'ru', 'tr', 'fr', 'ja',
		];
		// eslint-enable
	}

	lengthLimit() {
		return 5000;
	}

	throttleTime() {
		return 1000;
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

	private langMap: Record<string, string> = {
		en: 'eng',
		ar: 'ara',
		nl: 'dut',
		he: 'heb',
		es: 'spa',
		it: 'ita',
		zh: 'chi',
		de: 'ger',
		pl: 'pol',
		pt: 'por',
		ro: 'rum',
		ru: 'rus',
		tr: 'tur',
		fr: 'fra',
		ja: 'jpn',
	};

	translate(text: string, from: langCode, to: langCode) {
		const localFrom = this.langMap[from];
		const localTo = this.langMap[to];

		const data = {
			input: text,
			from: localFrom,
			to: localTo,
			format: 'text',
			options: {
				origin: 'reversodesktop',
				sentenceSplitter: true,
				contextResults: true,
				languageDetection: false,
			},
		};

		return fetch('https://api.reverso.net/translate/v1/translation', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
			body: JSON.stringify(data),
		})
			.then((r) => r.json())
			.then((response) => {
				if (
					!(response instanceof Object) ||
					!(response.translation instanceof Array) ||
					response.translation.every((i: any) => typeof i !== 'string')
				) {
					throw new Error('Unexpected response');
				}

				return (response.translation as string[]).join('');
			});
	}

	private readonly mtp = new Multiplexor({ tokenStart: '<', tokenEnd: '>' });
	translateBatch(text: string[], langFrom: langCode, langTo: langCode) {
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
