module.exports = {
	testEnvironment: 'node',

	preset: 'ts-jest/presets/js-with-ts-esm',

	transformIgnorePatterns: ['!node_modules/idb'],

	setupFiles: ['fake-indexeddb/auto'],
};
