import { AsyncMethodReturns, Connection, connectToChild } from 'penpal';

import {
	CustomTranslatorInfo,
	TranslatorWorkerApi,
} from '../../../offscreen-documents/translator';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { CustomTranslatorsParentFrameApi } from './types';

type CustomTranslatorsContext = {
	customTranslators: Map<
		string,
		{
			uniqueName?: string;
			iframe: HTMLIFrameElement;
			controller: Connection<TranslatorWorkerApi>;
		}
	>;
};

export const customTranslatorCreate = buildBackendRequest<
	{ code: string; uniqueName?: string },
	{ id: string; info: CustomTranslatorInfo },
	CustomTranslatorsContext
>('customTranslator.create', {
	factoryHandler:
		({ customTranslators }) =>
			async ({ code, uniqueName }) => {
			// Delete current instance if exists
				if (uniqueName) {
					const currentInstance = Array.from(customTranslators.entries()).find(
						([_id, info]) => info.uniqueName === uniqueName,
					);
					if (currentInstance) {
						const [instanceId, translator] = currentInstance;

						translator.controller.destroy();
						translator.iframe.remove();
						customTranslators.delete(instanceId);
					}
				}

				// Create iframe
				const iframe = document.createElement('iframe', {});
				iframe.setAttribute('sandbox', 'allow-scripts');
				document.body.appendChild(iframe);
				iframe.src = '/offscreen-documents/translator/translator.html';

				// Connect controller
				const controller = connectToChild<TranslatorWorkerApi>({
					iframe,
					childOrigin: '*',
					timeout: 5000,
					methods: {
						fetch: (url: string, options: RequestInit) => {
							return fetch(url, options).then(async (response) => {
								return {
									body: await response.blob(),
									status: response.status,
									statusText: response.statusText,
									headers: Object.fromEntries(
										Array.from(response.headers.entries()),
									),
								};
							});
						},
					} as AsyncMethodReturns<CustomTranslatorsParentFrameApi>,
				});

				const id = String(new Date().getTime());
				customTranslators.set(id, {
					uniqueName,
					iframe,
					controller,
				});

				try {
					const { init } = await controller.promise;
					const info = await init(code);
					return { id, info };
				} catch (error) {
					iframe.remove();
					customTranslators.delete(id);
					throw error;
				}
			},
});

export const customTranslatorDelete = buildBackendRequest<
	{ id: string },
	void,
	CustomTranslatorsContext
>('customTranslator.delete', {
	factoryHandler:
		({ customTranslators }) =>
			async ({ id }) => {
				const translator = customTranslators.get(id);
				if (!translator) throw new Error('Not found translator with provided id');

				translator.controller.destroy();
				translator.iframe.remove();
				customTranslators.delete(id);
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
	delete: customTranslatorDelete[1],
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

	[customTranslatorCreate, customTranslatorDelete, customTranslatorCall].forEach(
		([apiFactory]) => apiFactory({ customTranslators }),
	);
};
