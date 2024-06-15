import { serialize, unserialize } from '../../../lib/serializer';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { sendEventToOffscreenWorker } from './offscreenWorkerEvent';

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

				workers.set(workerId, worker);

				(['message', 'error', 'messageerror'] as const).forEach((eventName) => {
					worker.addEventListener(eventName, (event) => {
						if (!('data' in event)) return;

						sendEventToOffscreenWorker({
							workerId,
							name: eventName,
							data: event.data,
						});
					});
				});

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
