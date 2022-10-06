export const isTextsContainsSubstring = (
	substring: string,
	texts: string[],
	ignoreCase: boolean = true,
) => {
	const textToSearch = ignoreCase ? substring.toLowerCase() : substring;

	const isSomeTextMatch = texts.some((text) => {
		const transformedText = ignoreCase ? text.toLowerCase() : text;
		return transformedText.includes(textToSearch);
	});

	return isSomeTextMatch;
};
