const { readFileSync, readdirSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

const getChangedLocaleMessageNames = (locale) => {
	const localeFromTargetBranchRaw = execSync(
		`git show master:src/_locales/${locale.code}/messages.json`,
	).toString('utf8');
	const localeFromTargetBranch = JSON.parse(localeFromTargetBranchRaw);

	return Object.entries(locale.json)
		.filter(
			([key, { message }]) =>
				localeFromTargetBranch[key] === undefined ||
				message !== localeFromTargetBranch[key].message,
		)
		.map(([key]) => key);
};

module.exports = {
	localesDir: localesDir,
	getLocaleFilenames,
	getJsonFromFile,
	getLocaleObject,
	getSourceLocale,
	getChangedLocaleMessageNames,
};
