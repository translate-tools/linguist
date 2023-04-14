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
	const writeUpdates = (object) => {
		const stringifiedJSON = JSON.stringify(object, null, '\t');
		writeFileSync(targetLocalization.filename, stringifiedJSON);
	};

	// Remove messages that not exists in source
	const filteredJson = Object.fromEntries(
		Object.entries(targetLocalization.json).filter(
			([key]) => key in sourceLocalization.json,
		),
	);

	// Translate messages
	const gptTranslator = await getGPTTranslator();

	const messagesToTranslate = Object.entries(sourceLocalization.json).filter(
		([key]) => !(key in filteredJson) && !key.startsWith('langCode_'),
	);

	let collectedMessages = { ...filteredJson };

	const languageNames = new Intl.DisplayNames([targetLocalization.code], {
		type: 'language',
	});
	Object.keys(sourceLocalization.json).forEach((messageName) => {
		const langCodePrefix = 'langCode_';
		if (!messageName.startsWith(langCodePrefix)) return;

		const langCode = messageName.slice(langCodePrefix.length);
		let langName = languageNames.of(langCode);
		langName = langName[0].toUpperCase() + langName.slice(1);

		collectedMessages[langCodePrefix + langCode] = {
			message: langName,
		};
	});

	writeUpdates(collectedMessages);

	const batchSize = 5;
	for (let offset = 0; offset < messagesToTranslate.length; offset += batchSize) {
		const messagesEntries = messagesToTranslate.slice(offset, offset + batchSize);

		const messages = Object.fromEntries(messagesEntries);

		try {
			const translatedMessages = await gptTranslator.handleJson(messages, {
				from: sourceLocalization.code,
				to: targetLocalization.code,
			});

			// Merge messages
			const updatedMessages = { ...collectedMessages, ...translatedMessages };

			// Write changes
			writeUpdates(updatedMessages);

			// Remember merged changes
			collectedMessages = updatedMessages;
		} catch (err) {
			// Skip errors and continue translation
			console.error(
				`Error while translate slice #${offset / batchSize} for file "${
					targetLocalization.filename
				}": `,
				err,
			);
		}
	}
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
