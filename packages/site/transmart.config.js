/* eslint-disable @cspell/spellchecker */
const context = `
Context:
- Product: Linguist, a privacy-first all-in-one browser extension for translate content in browser.
- Audience: primarily women aged 26–38 across mixed professions (e.g., aircraft engineer, programmer, lawyer, sales agent) who are smart, busy, and not necessarily IT-oriented. The copy must remain gender-neutral (never address “women” directly) and welcoming to men as well.
- Brand voice: confident, calm, and slightly elegant; subtle warmth is fine, but no stereotypes, no “productivity-bro” tone, no cute/flirty lines, and no forced metaphors.

Requirements:
- Produce a native, natural-sounding translation that reads like original copy written in target language, not a literal translation.
- Preserve meaning, tone, and persuasion level: clear, confident, and concise (no slang; no corporate jargon).
- Keep the text easy to understand for non-technical users while staying accurate for technical users.
- Avoid English idioms that don’t translate well. If an idiom/metaphor would sound unnatural, replace it with a culturally natural equivalent.
- Prefer concrete verbs and clear subjects. Remove ambiguity (e.g., specify what is unlocked/edited if English is unclear).
- Keep terminology consistent across the whole text. If a term should remain in English, keep it consistently; otherwise translate it consistently.
- Don’t add new claims, features, or extra explanations. Don’t remove meaning.
- Avoid any imperative overuse in translation.
- Bring the value in texts, not a fluff. Every slogan and description must contain the completed and insightful thought, not just the emotions.
	- Bad: "Deepink — приложение для заметок с <0>акцентом на приватность</0>, которое помогает поддерживать идеальный порядок.". The "идеальный порядок" is a fluff, user can't understand why it does matter and why they needed in that.
	- Good: "Deepink — приложение для быстрого создания и огранизации заметок, <0>уважающее вашу приватность</0>.". That is ergonomic and elegant description that explains the elaborates what exactly Deepink can organize, and how exactly it can be useful for user in real world.
- Headers and introductions may be a bit playful to sell a product, but do not overuse it.
- Translate texts with considering a SEO. Use strong and fluent keywords native in target language when it possible, to help user find Linguist in google while searching.

Constraints:
- Preserve all literal newline escapes like "\n\n" and paragraph structure.
- Don’t introduce punctuation/formatting that complicates localization.
- When text is wrapped via some substitutions <0>like that</0> or <custom-component>like that</custom-component>, you must analyze what exactly is highlighted in original text from a semantic perspective, and wrap equal segment in the translation.
- Use clear, modern, non-bureaucratic language. For example in Russian (avoid канцелярит like “в рамках”, “протоколы встреч” unless the English explicitly implies minutes).
- Keep sentences close in length to the original when possible.
- Do not rephrase the idea and tone of voice of the text and keep original meaning.
`.trim();

// See config reference at https://github.com/Quilljou/transmart#options
module.exports = {
	baseLocale: 'en',
	locales: Array.from(
		new Set([
			'en',
			'ru',
			'es',
			'fr',
			'it',
			'de',
			'ru',
			'hi',
			'ar',
			'bn',
			'pt',
			'vi',
			'tr',
			'mr',
			'te',
			'pa',
			'ko',
			'ta',
			'ur',
			'jv',
			'gu',
			'zh',
			'ja',
		]),
	),
	localePath: './src/i18n/locales',

	openAIApiKey: process.env.OPENAI_API_KEY,
	openAIApiUrl: process.env.OPENAI_API_URL,

	// openAIApiModel: 'openai/gpt-4o-mini',
	// modelContextLimit: 128_000,

	openAIApiModel: 'google/gemini-3.1-pro-preview',
	modelContextLimit: 100_000,

	// openAIApiModel: 'openai/gpt-5.4',
	// // openAIApiModel: 'anthropic/claude-sonnet-4.6',
	// // openAIApiModel: 'anthropic/claude-opus-4.6',
	// modelContextLimit: 1_000_000,
	context,
};
