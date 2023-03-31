const { writeFileSync } = require('fs');

const {
	getLocaleFilenames,
	getLocaleObject,
	getChangedLocaleMessageNames,
} = require('.');

let gptFixer = null;
const getGPTFixer = async () => {
	if (gptFixer === null) {
		gptFixer = new Promise(async (res) => {
			const { ChatGPTUtils } = await import('../../ChatGPT.mjs');

			const translator = (stringifiedJSON) =>
				`Fix errors and make text clear in this JSON below and send me back only JSON with no your comments. Do not add dots in a texts:\n${stringifiedJSON}`;
			res(new ChatGPTUtils(translator));
		});
	}

	return gptFixer;
};

const fixTyposInLocalizationsFile = async (localization, fixAll = false) => {
	const changedMessageNames = getChangedLocaleMessageNames(localization);

	const jsonSliceToFix = Object.fromEntries(
		Object.entries(localization.json).filter(([key]) => {
			// Skip language names
			if (key.startsWith('langCode_')) return false;

			// Skip not changed messages
			if (!fixAll && changedMessageNames.indexOf(key) === -1) return false;

			return true;
		}),
	);

	const gptFixer = await getGPTFixer();
	const fixedMessages = await gptFixer.handleJson(jsonSliceToFix);

	const updatedMessages = { ...localization.json, ...fixedMessages };

	// Write changes
	const stringifiedJSON = JSON.stringify(updatedMessages, null, '\t');
	writeFileSync(localization.filename, stringifiedJSON);
};

const fixTyposInLocalizationsFiles = async (fixAll = false) => {
	const localizationFiles = getLocaleFilenames();
	for (const localizationFilename of localizationFiles) {
		const localization = getLocaleObject(localizationFilename);
		await fixTyposInLocalizationsFile(localization, fixAll);
	}
};

module.exports = {
	fixTyposInLocalizationsFiles,
};
