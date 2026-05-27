import { Blob } from 'blob-polyfill';

globalThis.Blob = Blob;

require('jest-webextension-mock');

const extBasePath = 'moz-extension://8b413e68-1e0d-4cad-b98e-1eb000799783/';

// Expose MV3 chrome.action as an alias for browserAction so tests can spy on it
// without mocking the webextension-polyfill module directly.
// webextension-polyfill passes chrome.action.* through without Promise-wrapping when
// it lacks metadata for the action namespace — so set mockResolvedValue here so .catch()
// works in the controller. vi.clearAllMocks() clears call history but not implementations,
// so this persists across tests within a file.
globalThis.chrome.action = globalThis.chrome.browserAction;
globalThis.chrome.browserAction.setBadgeText.mockResolvedValue(undefined);
globalThis.chrome.browserAction.setBadgeBackgroundColor.mockResolvedValue(undefined);

// Add id to run `webextension-polyfill` not in browser
globalThis.chrome.runtime.id = 'test-extension-id';
globalThis.chrome.runtime.getURL = (path) => String(new URL(path, extBasePath));
globalThis.location = new URL('/_generated_background_page.html', extBasePath);
globalThis.navigator = {
	userAgent: 'node.js',
};

const { addRandomDelaysForMethods } = require('./utils');

// Add random delays for async operations,
// to make tests closer to reality
chrome.storage.local = addRandomDelaysForMethods(chrome.storage.local, ['get', 'set']);
