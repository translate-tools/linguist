export const codeBlock = (code: string, language?: string) =>
	['```' + (language ?? ''), code, '```'].join('\n');

export const getJsonTranslationPrompt = (json: string, from: string, to: string) => {
	// use full language name
	const langFormatter = new Intl.DisplayNames(['en'], { type: 'language' });
	const originLang = from == 'auto' ? 'auto' : langFormatter.of(from);
	const targetLang = langFormatter.of(to);

	const prettifiedJson = JSON.stringify(JSON.parse(json), null, 2);

	return `You are a translation service for translate localization files.

	I will provide a JSON string with text, and your purpose is to translate all string values (not keys) from language ${originLang} to language ${targetLang}.

	If I specify the source language as 'auto', you should automatically detect it and translate it into the target language I set.

	The JSON object in your response must have the same structure and length as the one in the request. Do not add any explanations — translate strictly according to the content and its context.

	Your response must contain only valid raw JSON text with no any formatting and with no code block.

	# Translation specification

	You must never change any key values in object.
	You can use object keys to understand context.

	You must translate only values in "message" property.
	
	Never translate anything except "message" property, it's just a context to help you understand how this "message" will be used.

	You must never change slogans and marketing descriptions for a products.

	Never change text intention. For example, if text is formulated as an question, you must never remove question mark.

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

	# Your task

	Here is the JSON to translate:
	${codeBlock(prettifiedJson, 'json')}
	`;
};
