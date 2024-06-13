import browser from 'webextension-polyfill';

import { serialize, unserialize } from '../../lib/serializer';

const workers = new Map<string, Worker>();

console.log('Hi from offscreen');
browser.runtime.onMessage.addListener((rawMessage) => {
	const message = unserialize(rawMessage);

	console.log('WORKER: Received request', message);
	switch (message.action) {
		case 'offscreenWorker.create': {
			const workerId = String(new Date().getTime());
			const worker = new Worker(message.data.url);

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
			return Promise.resolve(workerId);
		}
		case 'offscreenWorker.postMessage': {
			const { workerId, args } = message.data;

			const worker = workers.get(workerId);
			if (!worker) {
				console.error('Not found worker', workerId);
				return;
			}

			worker.postMessage(args);

			return Promise.resolve();
		}
		case 'offscreenWorker.terminate': {
			const { workerId } = message.data;

			const worker = workers.get(workerId);
			if (!worker) {
				console.error('Not found worker', workerId);
				return;
			}

			worker.terminate();
			workers.delete(workerId);

			return Promise.resolve();
		}
	}

	return;
});
