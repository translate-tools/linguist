export type EventManagerCallback<T> = (data: T) => void;

export class EventManager<T = unknown> {
	private readonly handlers = new Map<string, Set<EventManagerCallback<T>>>();

	public subscribe(eventName: string, handler: EventManagerCallback<T>) {
		if (!this.handlers.has(eventName)) {
			this.handlers.set(eventName, new Set());
		}

		const handlersSet = this.handlers.get(eventName);
		if (handlersSet !== undefined) {
			handlersSet.add(handler);
		}
	}

	public unsubscribe(eventName: string, handler: EventManagerCallback<T>) {
		const handlersSet = this.handlers.get(eventName);
		if (handlersSet === undefined) return;

		handlersSet.delete(handler);
	}

	public emit(eventName: string, data: T) {
		const handlersSet = this.handlers.get(eventName);
		if (handlersSet !== undefined) {
			handlersSet.forEach((handler) => handler(data));
		}
	}
}
