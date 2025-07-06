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

	# Translation specification

	You must never change any key values in object.
	You can use object keys to understand context.

	You must translate only values in "message" property.
	
	Never translate anything except "message" property, it's just a context to help you understand how this "message" will be used.

	For example, you must never translate any texts for keys like "placeholders", "example".

	Let's see next example:

	\`\`\`json
	"translatorsManagerWindow_message_translatorRemovingConfirmation": {
		"message": "Are you sure about removing translator \"$translator_name$\"?",
		"placeholders": {
			"translator_name": {
				"content": "$1",
				"example": "Google translator"
			}
		}
	},
	\`\`\`

	Here you must translate only "message", but never translate "example" or "content", or anything else.

	Double check that you never translate "example" texts.

	# Translation recommendations

	You may rephrase texts to make it look native for target language, but you must keep the common sense of every "message" according to its context of use.

	Be careful when creating an JSON object; it must be syntactically correct and do not change quotation marks.

	# Your task

	Here is the JSON to translate:
	${codeBlock(prettifiedJson, 'json')}
	`;
};
