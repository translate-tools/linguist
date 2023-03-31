const { writeFileSync } = require('fs');

const { getSourceLocale } = require('.');

let gptFixer = null;
const getGPTFixer = async () => {
	if (gptFixer === null) {
		gptFixer = new Promise(async (res) => {
			const { ChatGPTUtils } = await import('../../ChatGPT.mjs');

			const translator = (stringifiedJSON) =>
				`Fix errors and make text clear in this JSON below and send me back only JSON with no your comments. Do not add dot on end of message:\n${stringifiedJSON}`;
			res(new ChatGPTUtils(translator));
		});
	}

	return gptFixer;
};

// TODO: handle all locales
// TODO: fix only specified messages
const fixTyposInLocalizationsFiles = async () => {
	const localization = getSourceLocale();

	const jsonSliceToFix = Object.fromEntries(
		Object.entries(localization.json).filter(([key]) => !key.startsWith('langCode_')),
	);

	const gptFixer = await getGPTFixer();
	const fixedMessages = await gptFixer.handleJson(jsonSliceToFix);

	const updatedMessages = { ...localization.json, ...fixedMessages };

	// Write changes
	const stringifiedJSON = JSON.stringify(updatedMessages, null, '\t');
	writeFileSync(localization.filename, stringifiedJSON);
};

module.exports = {
	fixTyposInLocalizationsFiles,
};
