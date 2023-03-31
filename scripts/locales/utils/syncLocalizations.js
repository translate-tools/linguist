const { writeFileSync } = require('fs');

const { getLocaleFilenames, getSourceLocale, getLocaleObject } = require('.');

let gptUtils = null;
const getGPTUtils = async () => {
	if (gptUtils === null) {
		gptUtils = new Promise(async (res) => {
			const { ChatGPTUtils } = await import('../../ChatGPT.mjs');
			res(new ChatGPTUtils());
		});
	}

	return gptUtils;
};

const syncLocalizationsMessagesWithSource = async (
	sourceLocalization,
	targetLocalization,
) => {
	// Remove messages that not exists in source
	const filteredJson = Object.fromEntries(
		Object.entries(targetLocalization.json).filter(
			([key]) => key in sourceLocalization.json,
		),
	);

	// Translate messages
	const messagesToAdd = Object.fromEntries(
		Object.entries(sourceLocalization.json).filter(([key]) => !(key in filteredJson)),
	);

	const gptUtils = await getGPTUtils();
	const translatedMessages = await gptUtils.translateJson(
		messagesToAdd,
		sourceLocalization.code,
		targetLocalization.code,
	);

	console.warn({ translatedMessages });

	// Add messages from source localization
	const updatedMessages = { ...filteredJson, ...translatedMessages };

	// Write changes
	const stringifiedJSON = JSON.stringify(updatedMessages, null, '\t');
	writeFileSync(targetLocalization.filename, stringifiedJSON);
};

const syncLocalizationsFilesWithSource = async () => {
	const sourceLocalization = getSourceLocale();
	const localizationFiles = getLocaleFilenames();

	for (const filePath of localizationFiles) {
		// Skip source file
		if (filePath === sourceLocalization.filename) continue;

		const targetLocalization = getLocaleObject(filePath);
		await syncLocalizationsMessagesWithSource(sourceLocalization, targetLocalization);
	}
};

module.exports = {
	syncLocalizationsMessagesWithSource,
	syncLocalizationsFilesWithSource,
};
