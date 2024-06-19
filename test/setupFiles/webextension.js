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

// Add random delays for async operations,
// to make tests closer to reality
const originalStorageLocal = chrome.storage.local;
chrome.storage.local = new Proxy(originalStorageLocal, {
	get(target, prop) {
		const object = target[prop];
		if (typeof object !== 'function') return object;

		const isNeedDelay = ['get', 'set'].includes(prop);

		return (...args) => {
			if (!isNeedDelay) {
				return object(...args);
			}

			return Promise.resolve().then(async () => {
				function getRandomInt(max = 1) {
					return Math.floor(Math.random() * max);
				}

				const delay = getRandomInt(20);

				console.log('Wait a delay', delay);
				await new Promise((res) => setTimeout(res, delay));

				return object(...args);
			});
		};
	},
});
