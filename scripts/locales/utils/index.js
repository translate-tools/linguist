const { readFileSync, readdirSync } = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../../../src/_locales');

const getLocaleFilenames = () => {
	const languages = readdirSync(localesDir);
	return languages.map((langCode) =>
		path.resolve(__dirname, `../../../src/_locales/${langCode}/messages.json`),
	);
};

const getJsonFromFile = (filePath) => {
	const fileBuffer = readFileSync(filePath, { encoding: 'utf8' });
	return JSON.parse(fileBuffer);
};

const getLocaleObject = (filePath) => {
	const code = path.basename(path.dirname(filePath));
	const sourceJSON = getJsonFromFile(filePath);

	return {
		filename: filePath,
		code,
		json: sourceJSON,
	};
};

const getSourceLocale = () => getLocaleObject(path.join(localesDir, 'en/messages.json'));

module.exports = {
	localesDir: localesDir,
	getLocaleFilenames,
	getJsonFromFile,
	getLocaleObject,
	getSourceLocale,
};
