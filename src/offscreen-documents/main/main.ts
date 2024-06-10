/**
 * Since we may use only one offscreen document, this is a root document,
 * that include another ones as iframes
 */

import { Connection, connectToChild } from 'penpal';
import browser from 'webextension-polyfill';

import { unserialize } from '../../lib/serializer';

import { TranslatorWorkerApi } from '../translator';

// TODO: add types validation between all requests
console.log('Main is run');

document.addEventListener('DOMContentLoaded', async () => {
	const iframe1 = document.createElement('iframe', {});
	iframe1.src = '/offscreen-documents/worker/worker.html';
	iframe1.setAttribute(
		'sandbox',
		'allow-same-origin allow-scripts allow-popups allow-forms',
	);
	document.body.appendChild(iframe1);

	const customTranslators: Map<
		string,
		{
			iframe: HTMLIFrameElement;
			controller: Connection<TranslatorWorkerApi>;
		}
	> = new Map();
	browser.runtime.onMessage.addListener((rawMessage) => {
		const message = unserialize(rawMessage);
		switch (message.action) {
			case 'customTranslator.create': {
				return new Promise(async (resolve, reject) => {
					// Create iframe
					const iframe = document.createElement('iframe', {});
					iframe.src = '/offscreen-documents/translator/translator.html';
					iframe.setAttribute(
						'sandbox',
						'allow-same-origin allow-scripts allow-popups allow-forms',
					);
					document.body.appendChild(iframe);

					// Connect controller
					const controller = connectToChild<TranslatorWorkerApi>({
						iframe,
						childOrigin: '*',
						timeout: 5000,
						debug: true,
					});

					const id = String(new Date().getTime());
					customTranslators.set(id, {
						iframe,
						controller,
					});

					try {
						const { init } = await controller.promise;
						await init(message.data.code);
						resolve(id);
					} catch (error) {
						iframe.remove();
						customTranslators.delete(id);
						reject(error);
					}
				});
			}
			case 'customTranslator.call': {
				const translator = customTranslators.get(message.data.id);
				if (!translator)
					return Promise.reject(
						new Error('Not found translator with provided id'),
					);

				return Promise.resolve().then(async () => {
					const api = await translator.controller.promise;

					const method = (api as any)[message.data.method];
					if (!method) throw new Error('Not found requested method');

					return method(...message.data.args);
				});
			}
		}
	});
});
