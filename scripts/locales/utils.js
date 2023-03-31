const { readFileSync, readdirSync } = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../../src/_locales');

const getLocaleFilenames = () => {
	const languages = readdirSync(localesDir);
	return languages.map((langCode) =>
		path.resolve(__dirname, `../../src/_locales/${langCode}/messages.json`),
	);
};

const getJsonFromFile = (filePath) => {
	const fileBuffer = readFileSync(filePath, { encoding: 'utf8' });
	return JSON.parse(fileBuffer);
};

const getSourceLocale = () => {
	const code = 'en';
	const sourceFile = getLocaleFilenames().find((filename) =>
		filename.endsWith(`${code}/messages.json`),
	);
	if (!sourceFile) throw new Error('Cannot find a source file');

	const sourceJSON = getJsonFromFile(sourceFile);

	return {
		code,
		filename: sourceFile,
		json: sourceJSON,
	};
};

module.exports = { localesDir, getLocaleFilenames, getJsonFromFile, getSourceLocale };
