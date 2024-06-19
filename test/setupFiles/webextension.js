import { Blob } from 'buffer';

globalThis.Blob = Blob;

require('jest-webextension-mock');

const extBasePath = 'moz-extension://8b413e68-1e0d-4cad-b98e-1eb000799783/';

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
