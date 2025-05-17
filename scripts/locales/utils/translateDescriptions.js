const { writeFileSync, existsSync, readFileSync } = require('fs');
const path = require('path');
const { getLocaleFilenames, getLocaleObject } = require('.');

let gptTranslator = null;
const getGPTTranslator = async () => {
	if (gptTranslator === null) {
		gptTranslator = new Promise(async (res) => {
			const { ChatGPTUtils } = await import('../../ChatGPT.mjs');
			const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
			const translator = (text, { from, to }) =>
				`Translate this text below from ${languageNames.of(
					from,
				)} to ${languageNames.of(
					to,
				)} and send me back only text with no your comments. Never translate a word "Linguist":\n${text}`;
			res(new ChatGPTUtils(translator));
		});
	}
	return gptTranslator;
};
const descriptionsDir = path.resolve(
	path.join(__dirname, '../../../assets/stores/description'),
);
const getDescriptionFilenameByCode = (code) => path.join(descriptionsDir, code + '.md');
const translateDescription = async (descriptionSourceLanguage, descriptionLanguage) => {
	const writeUpdates = (lang, data) => {
		writeFileSync(getDescriptionFilenameByCode(lang), data);
	};

	const sourceText = readFileSync(
		getDescriptionFilenameByCode(descriptionSourceLanguage),
		{ encoding: 'utf8' },
	);

	// Split text
	const separator = '\n\n';
	const sourceTextParts = sourceText.split(separator);

	const textLimit = 1500;
	const sourceTextLimitedParts = [];

	let currentTextSlice = [];
	for (const textPart of sourceTextParts) {
		// Force push text for empty slice
		if (currentTextSlice.length === 0) {
			currentTextSlice.push(textPart);
			continue;
		}

		// Fit text in slice if possible
		const sliceLen =
			currentTextSlice.reduce((acc, slice) => acc + slice.length, 0) +
			currentTextSlice.length * separator.length;
		if (sliceLen + textPart.length <= textLimit) {
			currentTextSlice.push(textPart);
			continue;
		}

		// Handle case when text not fit
		sourceTextLimitedParts.push(currentTextSlice.join(separator));
		currentTextSlice = [textPart];
	}
	if (currentTextSlice.length !== 0) {
		sourceTextLimitedParts.push(currentTextSlice.join(separator));
	}

	console.warn('Limited text parts', sourceTextLimitedParts.length);

	// Translate
	const translator = await getGPTTranslator();
	const translatedParts = [];
	let counter = 0;
	for (const textPart of sourceTextLimitedParts) {
		console.log(
			`Translate text slice ${++counter}/${sourceTextLimitedParts.length} with ${
				textPart.length
			} chars`,
		);
		const translatedPart = await translator.sendMessage(textPart, {
			from: descriptionSourceLanguage,
			to: descriptionLanguage,
		});

		console.log(
			'Translation',
			{ from: descriptionSourceLanguage, to: descriptionLanguage },
			translatedPart.text,
		);
		translatedParts.push(translatedPart.text);
	}

	writeUpdates(descriptionLanguage, translatedParts.join(separator));
};

const translateDescriptions = async () => {
	const descriptionSourceLanguage = 'en';
	const maintainedLanguages = ['en', 'ru'];

	// Get supported languages list
	const localizations = getLocaleFilenames()
		.map((filename) => getLocaleObject(filename).code)
		.filter((lang) => {
			if (maintainedLanguages.includes(lang)) {
				console.log(`Skip "${lang}", because it is maintained language`);
				return false;
			}
			if (process.env.STRATEGY === 'ADD_NEW') {
				const filePath = getDescriptionFilenameByCode(lang);
				const isFileExists = existsSync(filePath);
				if (isFileExists) {
					console.log(`Skip "${lang}", because file exists (strategy ADD_NEW)`);
					return false;
				}
				return true;
			}
			return true;
		});

	// Generate descriptions
	for (const descriptionLanguage of localizations) {
		try {
			console.log(`Translate language ${descriptionLanguage}...`);
			await translateDescription(descriptionSourceLanguage, descriptionLanguage);
		} catch (err) {
			// Ignore errors and just log it
			console.error(`Cannot translate "${descriptionLanguage}"`, err);
		}
	}
};

module.exports = {
	translateDescriptions,
};
