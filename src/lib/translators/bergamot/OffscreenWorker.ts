import browser from 'webextension-polyfill';

import { offscreenWorkerApi } from '../../../requests/offscreen/offscreenWorker';
import { unserialize } from '../../serializer';

export class OffscreenWorker implements Worker {
	public onmessage: Worker['onmessage'] = null;
	public onmessageerror: Worker['onmessageerror'] = null;
	public onerror: Worker['onerror'] = null;

	private workerId: Promise<string>;
	constructor(url: string) {
		this.workerId = offscreenWorkerApi.create({ url });

		let workerId: string | null = null;
		this.workerId.then((id) => {
			workerId = id;
		});

		browser.runtime.onMessage.addListener((rawMessage) => {
			const message = unserialize(rawMessage);
			switch (message.action) {
				case 'offscreenWorkerClient.event': {
					// Skip messages addressed to another instances
					if (workerId === null || workerId !== message.data.workerId) return;

					const listeners = this.listeners[message.data.name];
					if (!listeners) return;

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
		this.workerId.then((workerId) => {
			offscreenWorkerApi.postMessage({ workerId, args });
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
		this.workerId.then((workerId) => {
			offscreenWorkerApi.terminate({ workerId });
		});
	}

	public dispatchEvent(_event: Event): boolean {
		throw new Error(
			'Method "dispatchEvent" is not implemented yet for OffscreenWorker',
		);
	}
}
