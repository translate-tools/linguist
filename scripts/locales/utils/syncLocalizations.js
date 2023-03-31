const { writeFileSync } = require('fs');

const { getLocaleFilenames, getSourceLocale, getLocaleObject } = require('.');

let gptTranslator = null;
const getGPTTranslator = async () => {
	if (gptTranslator === null) {
		gptTranslator = new Promise(async (res) => {
			const { ChatGPTUtils } = await import('../../ChatGPT.mjs');

			const translator = (stringifiedJSON, { from, to }) =>
				`Translate this JSON below from ${from} to ${to} and send me back only JSON with no your comments:\n${stringifiedJSON}`;
			res(new ChatGPTUtils(translator));
		});
	}

	return gptTranslator;
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

	const gptTranslator = await getGPTTranslator();
	const translatedMessages = await gptTranslator.handleJson(messagesToAdd, {
		from: sourceLocalization.code,
		to: targetLocalization.code,
	});

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
