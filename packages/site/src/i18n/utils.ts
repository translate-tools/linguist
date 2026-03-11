export function getNativeLanguageName(langCode: string) {
	const display = new Intl.DisplayNames([langCode], {
		type: 'language',
	});

	const name = display.of(langCode);
	if (!name) throw new Error(`Cannot display language name for code ${langCode}`);

	return name;
}
