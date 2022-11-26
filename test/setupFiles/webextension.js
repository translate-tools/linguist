require('jest-webextension-mock');

// Add id to run `webextension-polyfill` not in browser
globalThis.chrome.runtime.id = 'test-extension-id';
