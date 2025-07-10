export const codeBlock = (code: string, language?: string) =>
	['```' + (language ?? ''), code, '```'].join('\n');

export const getJsonTranslationPrompt = (json: string, from: string, to: string) => {
	// use full language name
	const langFormatter = new Intl.DisplayNames(['en'], { type: 'language' });
	const originLang = from == 'auto' ? 'auto' : langFormatter.of(from);
	const targetLang = langFormatter.of(to);

	const prettifiedJson = JSON.stringify(JSON.parse(json), null, 2);

	const languageRulesMap: Record<string, undefined | string[]> = {
		ru: ["Use letters ё whenever it's necessary, instead of ё"],
	};

	const languageRules = languageRulesMap[to];

	return `You are a translation service for translate localization files.

	I will provide a JSON string with text, and your purpose is to translate all string values (not keys) from language ${originLang} to language ${targetLang}.

	The JSON object in your response must have the same structure and length as the one in the request. Do not add any explanations — translate strictly according to the content and its context.

	Your response must contain only valid raw JSON text with no any formatting and with no code block.

	# Translation specification

	You must never change any key values in object.
	You can use object keys to understand context.

	You must translate only values in "message" property, but you must return JSON structure equal to source JSON, even if you do not translate some properties, just leave it as is.

	Double check that translated object have exact equal structure to source object. If object have any items among "message", all of them must be preserved in translated object.
	
	Never translate anything except "message" property, it's just a context to help you understand how this "message" will be used.

	You must never change slogans and marketing descriptions for a products, just translate it.

	Never change text intention. For example, if text is formulated as an question, you must never remove question mark.

	Never translate any terminology.

	Use **neutral tone** appropriate for buttons, labels, menus, and other UI elements.
	When translating actions (like buttons or menu items), use **infinitive verb forms** (e.g., “to save”, “to select”) in the target language — not imperatives, unless the source is a direct command.
	Do **not add personal pronouns** (like “you”, “your”) unless explicitly present in the source text.
	Keep translations **concise** and **formal**, suitable for compact interface space.
	Do **not add punctuation** unless the original contains it.
	Do **not rephrase** or expand the meaning.

	# The context

	You must consider next project description as context when you work on localization:

	> Linguist is a browser extension for translate web pages. It is a full-featured translation solution.
	> With Linguist user may run full page translation, translate any custom text, translate selected text.
	> Linguist supports a custom translators, so user can add its own implementation of translator module.
	> Linguist is a privacy focused, includes embedded modules for offline translation in user device (locally).

	# Translation recommendations

	You may rephrase texts to make it look native for target language, but you must keep the common sense of every "message" according to its context of use.

	Keep language professional and clear.
	Translate text as an educated person, don't use colloquialisms and explicit language.
	Make sure word forms looks clear and not ridiculous.

	Be careful when creating an JSON object; it must be syntactically correct and do not change quotation marks.

	Make sure every translated message sounds natively in ${targetLang} language.
	Make sure twice, that every translated message sounds natively in ${targetLang} language.

	${
	languageRules
		? `# Language specific rules\nFollow the next rules for ${targetLang} language:\n${languageRules}`
		: ''
}

	# Your task

	Here is the JSON to translate:
	${codeBlock(prettifiedJson, 'json')}
	`;
};
