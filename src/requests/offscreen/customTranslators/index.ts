import { Connection, connectToChild } from 'penpal';

import { isChromium } from '../../../lib/browser';
import { TranslatorWorkerApi } from '../../../offscreen-documents/translator';
import { buildBackendRequest } from '../../utils/requestBuilder';

type CustomTranslatorsContext = {
	customTranslators: Map<
		string,
		{
			iframe: HTMLIFrameElement;
			controller: Connection<TranslatorWorkerApi>;
		}
	>;
};

export const customTranslatorCreate = buildBackendRequest<
	{ code: string },
	string,
	CustomTranslatorsContext
>('customTranslator.create', {
	factoryHandler:
		({ customTranslators }) =>
			async ({ code }) => {
			// Create iframe
				const iframe = document.createElement('iframe', {});
				// iframe.src = 'https://example.com';
				iframe.setAttribute('sandbox', 'allow-scripts');
				document.body.appendChild(iframe);
				iframe.src = '/offscreen-documents/translator/translator.html';

				// setTimeout(() => {
				// 	iframe.src = 'offscreen-documents/translator/translator.html';
				// }, 500);

				// Connect controller
				const controller = connectToChild<TranslatorWorkerApi>({
					iframe,
					childOrigin: isChromium() ? '*' : undefined,
					// timeout: 5000,
					debug: true,
				});

				const id = String(new Date().getTime());
				customTranslators.set(id, {
					iframe,
					controller,
				});

				try {
					const { init } = await controller.promise;
					await init(code);
					return id;
				} catch (error) {
					iframe.remove();
					customTranslators.delete(id);
					throw error;
				}
			},
});

export const customTranslatorCall = buildBackendRequest<
	{ id: string; method: string; args: any[] },
	any,
	CustomTranslatorsContext
>('customTranslator.call', {
	factoryHandler:
		({ customTranslators }) =>
			async ({ id, method, args }) => {
				const translator = customTranslators.get(id);
				if (!translator) throw new Error('Not found translator with provided id');

				const api = await translator.controller.promise;

				const methodCallback = (api as any)[method];
				if (!methodCallback) throw new Error('Not found requested method');

				return methodCallback(...args);
			},
});

export const customTranslatorsApi = {
	create: customTranslatorCreate[1],
	call: customTranslatorCall[1],
};

export const customTranslatorsFactory = () => {
	const customTranslators: Map<
		string,
		{
			iframe: HTMLIFrameElement;
			controller: Connection<TranslatorWorkerApi>;
		}
	> = new Map();

	[customTranslatorCreate, customTranslatorCall].forEach(([apiFactory]) =>
		apiFactory({ customTranslators }),
	);
};
