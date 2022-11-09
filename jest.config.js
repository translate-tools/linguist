module.exports = {
	testEnvironment: 'node',

	preset: 'ts-jest/presets/js-with-ts-esm',

	setupFiles: ['fake-indexeddb/auto'],
};
