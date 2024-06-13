import browser from 'webextension-polyfill';

import { serialize, unserialize } from '../../../lib/serializer';
import { buildBackendRequest } from '../../utils/requestBuilder';

type OffscreenWorkerContext = {
	workers: Map<string, Worker>;
};

const offscreenWorkerCreate = buildBackendRequest<
	{ url: string },
	string,
	OffscreenWorkerContext
>('offscreenWorker.create', {
	factoryHandler:
		({ workers }) =>
			async ({ url }) => {
				const workerId = String(new Date().getTime());
				const worker = new Worker(url);

				// TODO: call remote hook instead of direct call
				(['message', 'error', 'messageerror'] as const).forEach((eventName) => {
					worker.addEventListener(eventName, (event) => {
						console.log('Event on worker', eventName, event);

						if (!('data' in event)) return;

						browser.runtime.sendMessage(
							serialize({
								action: 'offscreenWorkerClient.event',
								data: {
									workerId,
									name: eventName,
									data: event.data,
								},
							}),
						);
					});
				});

				workers.set(workerId, worker);

				console.log('OFFSCREEN: Created worker', workerId);
				return workerId;
			},
});

const offscreenWorkerTerminate = buildBackendRequest<
	{ workerId: string },
	void,
	OffscreenWorkerContext
>('offscreenWorker.terminate', {
	factoryHandler:
		({ workers }) =>
			async ({ workerId }) => {
				const worker = workers.get(workerId);
				if (!worker) {
					throw new Error(`Not found worker "${workerId}"`);
				}

				worker.terminate();
				workers.delete(workerId);
			},
});

const offscreenWorkerPostMessage = buildBackendRequest<
	{ workerId: string; args: any },
	void,
	OffscreenWorkerContext
>('offscreenWorker.postMessage', {
	factoryHandler:
		({ workers }) =>
			async ({ workerId, args }) => {
				const worker = workers.get(workerId);
				if (!worker) {
					throw new Error(`Not found worker "${workerId}"`);
				}

				worker.postMessage(unserialize(args));
			},
});

export const offscreenWorkerApi = {
	create: offscreenWorkerCreate[1],
	terminate: offscreenWorkerTerminate[1],
	postMessage: ({ workerId, args }: { workerId: string; args: any }) => {
		const postMessage = offscreenWorkerPostMessage[1];
		postMessage({
			workerId,
			args: serialize(args),
		});
	},
};

export const offscreenWorkerFactory = () => {
	const workers = new Map<string, Worker>();

	[offscreenWorkerCreate, offscreenWorkerTerminate, offscreenWorkerPostMessage].forEach(
		([apiFactory]) => apiFactory({ workers }),
	);
};
