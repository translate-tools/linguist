import { connectToParent } from 'penpal';
import { TranslatorInstanceMembers } from '@translate-tools/core/translators/Translator';

import { loadTranslator } from '../../lib/translators/customTranslators/loadTranslator';

console.log('Translator in run');

let translator: TranslatorInstanceMembers | null = null;
connectToParent({
	methods: {
		async init(code: string) {
			const translatorClass = loadTranslator(code);
			translator = new translatorClass();
		},
		async translate(text: string, from: string, to: string) {
			if (!translator) throw new Error('Translator is not defined');
			return translator.translate(text, from, to);
		},
		async translateBatch(texts: string[], from: string, to: string) {
			if (!translator) throw new Error('Translator is not defined');
			return translator.translateBatch(texts, from, to);
		},
	},
});
