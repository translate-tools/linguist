const { writeFileSync } = require('fs');
const path = require('path');

const { getLocaleFilenames, getJsonFromFile, getSourceLocale } = require('./utils');

async function syncProperties() {
	const { ChatGPTUtils } = await import('./ChatGPT.mjs');
	const gptUtils = new ChatGPTUtils();

	const sourceLocale = getSourceLocale();
	const sourceJSON = sourceLocale.json;

	const localeFiles = getLocaleFilenames();
	localeFiles.forEach(async (filePath) => {
		// Skip source file
		if (filePath === sourceLocale.filename) return;

		const localeJson = getJsonFromFile(filePath);
		const localeCode = path.basename(path.dirname(filePath));

		// Remove unnecessary messages
		const filteredJson = Object.fromEntries(
			Object.entries(localeJson).filter(([key]) => key in sourceJSON),
		);

		// Translate messages
		const messagesToAdd = Object.entries(sourceJSON).filter(
			([key]) => !(key in filteredJson),
		);

		const translatedMessages = await gptUtils.translateJson(
			Object.fromEntries(messagesToAdd),
			sourceLocale.code,
			localeCode,
		);

		console.warn({ translatedMessages });

		// Add messages from source localization
		Object.assign(filteredJson, translatedMessages);

		const stringifiedJSON = JSON.stringify(filteredJson, null, '\t');
		writeFileSync(filePath, stringifiedJSON);
	});
}

syncProperties();

module.exports = {};
