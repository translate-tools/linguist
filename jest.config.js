const jestGlobals = {};

// Speedup test
if (process.env.TEST_FAST) {
	const RED_COLOR = '\x1b[31m';
	console.warn(RED_COLOR, 'TEST DO NOT CHECK A TYPES!\n\n');

	jestGlobals['ts-jest'] = {
		isolatedModules: true,
	};
}

module.exports = {
	testEnvironment: 'node',

	globals: Object.keys(jestGlobals).length === 0 ? undefined : jestGlobals,

	preset: 'ts-jest/presets/js-with-ts-esm',

	resetMocks: false,
	setupFiles: [
		'jest-localstorage-mock',
		'fake-indexeddb/auto',
		'./test/setupFiles/webextension.js',
	],
};
