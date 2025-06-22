import { offscreenWorkerApi } from '../../../requests/offscreen/offscreenWorker';
import {
	OffscreenWorkerContext,
	offscreenWorkerEventFactory,
} from '../../../requests/offscreen/offscreenWorker/offscreenWorkerEvent';

export class OffscreenWorker implements Worker {
	public onmessage: Worker['onmessage'] = null;
	public onmessageerror: Worker['onmessageerror'] = null;
	public onerror: Worker['onerror'] = null;
	private workerId: Promise<string>;
	private requestsHandlerCleanup;
	constructor(url: string) {
		this.workerId = offscreenWorkerApi.create({ url });
		const requestsContext: OffscreenWorkerContext = {
			workerId: null,
			onMessage: (name, data) => {
				const listeners = this.listeners[name];
				if (!listeners) return;
				listeners.forEach((listener) => listener({ data }));
			},
		};
		this.workerId.then((id) => {
			requestsContext.workerId = id;
		});
		this.requestsHandlerCleanup = offscreenWorkerEventFactory(requestsContext);
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
			this.requestsHandlerCleanup();
		});
	}
	public dispatchEvent(_event: Event): boolean {
		throw new Error(
			'Method "dispatchEvent" is not implemented yet for OffscreenWorker',
		);
	}
}
