const { readFileSync, writeFileSync } = require('fs');

const { getLocaleFilenames } = require('./utils');

const sortPredicate = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const sortObject = (object) =>
	Object.fromEntries(
		Object.entries(object).sort(([keyA], [keyB]) => {
			const weightA = keyA.startsWith('langCode_') ? 1 : 0;
			const weightB = keyB.startsWith('langCode_') ? 1 : 0;

			if (typeof weightA === 'number' || typeof weightB === 'number') {
				if (typeof weightA === 'number' && typeof weightB === 'number')
					return weightA === weightB
						? sortPredicate(keyA, keyB)
						: sortPredicate(weightA, weightB);

				return typeof weightA === 'number' ? 1 : -1;
			}

			return sortPredicate(keyA, keyB);
		}),
	);

getLocaleFilenames().forEach((filePath) => {
	const fileBuffer = readFileSync(filePath, { encoding: 'utf8' });
	const localeJson = JSON.parse(fileBuffer);

	const sortedJson = sortObject(localeJson);

	const stringifiedJSON = JSON.stringify(sortedJson, null, '\t');
	writeFileSync(filePath, stringifiedJSON);
});

module.exports = {};
