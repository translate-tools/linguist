import { AsyncMethodReturns, connectToParent } from 'penpal';
import { TranslatorInstanceMembers } from '@translate-tools/core/translators/Translator';

import { loadTranslator } from '../../lib/translators/customTranslators/loadTranslator';
import { CustomTranslatorsParentFrameApi } from '../../requests/offscreen/customTranslators/types';

import { CustomTranslatorInfo, TranslatorWorkerApi } from '.';

let translator: TranslatorInstanceMembers | null = null;
const connection = connectToParent<CustomTranslatorsParentFrameApi>({
	methods: {
		async init(code: string) {
			const translatorClass = loadTranslator(code);
			translator = new translatorClass();

			const meta: CustomTranslatorInfo = {
				autoFrom: translatorClass?.isSupportedAutoFrom() ?? false,
				supportedLanguages: translatorClass?.getSupportedLanguages() ?? [],
				maxTextLength: translator?.getLengthLimit() ?? 5000,
				timeout: translator?.getRequestsTimeout() ?? 50,
			};

			return meta;
		},
		async translate(text: string, from: string, to: string) {
			if (!translator) throw new Error('Translator is not defined');
			return translator.translate(text, from, to);
		},
		async translateBatch(texts: string[], from: string, to: string) {
			if (!translator) throw new Error('Translator is not defined');
			return translator.translateBatch(texts, from, to);
		},
	} as AsyncMethodReturns<TranslatorWorkerApi>,
});

(window as any).fetch = async (input: string, init = {}) =>
	connection.promise.then((api) =>
		api
			.fetch(input, init)
			.then(({ body, ...options }) => new Response(body, options)),
	);
