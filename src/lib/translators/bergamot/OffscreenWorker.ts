import browser from 'webextension-polyfill';

import { serialize, unserialize } from '../../serializer';

export class OffscreenWorker implements Worker {
	public onmessage: Worker['onmessage'] = null;
	public onmessageerror: Worker['onmessageerror'] = null;
	public onerror: Worker['onerror'] = null;

	private workerId: Promise<string>;
	constructor(url: string) {
		this.workerId = browser.runtime.sendMessage({
			action: 'offscreenWorker.create',
			data: { url },
		});

		this.workerId.then((id) => console.log('Response from worker', id));

		browser.runtime.onMessage.addListener((rawMessage) => {
			const message = unserialize(rawMessage);
			switch (message.action) {
				case 'offscreenWorkerClient.event': {
					console.log('EVENT offscreenWorkerClient.event', message);
					const listeners = this.listeners[message.data.name];
					if (!listeners) return;

					console.log('Listeners to notify: ', listeners);
					listeners.forEach((listener) =>
						listener({ data: message.data.data }),
					);

					return Promise.resolve();
				}
			}

			return;
		});
	}

	public postMessage(args: any) {
		console.warn('DBG: postMessage to virtual worker', args);
		this.workerId.then((workerId) => {
			browser.runtime.sendMessage(
				serialize({
					action: 'offscreenWorker.postMessage',
					data: { workerId, args },
				}),
			);
		});
	}

	private listeners: Record<string, Set<(...args: any[]) => any>> = {};
	public addEventListener: Worker['addEventListener'] = (
		eventName: string,
		callback: (...args: any) => any,
	) => {
		const listenersSet = this.listeners[eventName] ?? new Set();
		listenersSet.add(callback);

		this.listeners[eventName] = listenersSet;
	};

	public removeEventListener: Worker['removeEventListener'] = (
		eventName: string,
		callback: (...args: any) => any,
	) => {
		const listenersSet = this.listeners[eventName] ?? new Set();
		listenersSet.delete(callback);

		this.listeners[eventName] = listenersSet;
	};

	public terminate() {
		throw new Error('Method "terminate" is not implemented yet for OffscreenWorker');
	}

	public dispatchEvent(_event: Event): boolean {
		throw new Error(
			'Method "dispatchEvent" is not implemented yet for OffscreenWorker',
		);
	}
}
