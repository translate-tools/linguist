import { RecordValues } from '../types/utils';

// TODO: replace old `EventManager` to new `XEventManager`
export class XEventManager<EventMap extends Record<string, (...args: any[]) => any>> {
	private readonly callbacks = new Map<
		keyof EventMap,
		Set<keyof RecordValues<EventMap>>
	>();

	/**
	 * Add callback for listen changes
	 */
	public subscribe = <K extends keyof EventMap>(event: K, handler: EventMap[K]) => {
		// Init map
		if (!this.callbacks.has(event)) {
			this.callbacks.set(event, new Set());
		}

		const eventHandlers = this.callbacks.get(event) as Set<EventMap[keyof EventMap]>;
		eventHandlers.add(handler);
	};

	/**
	 * Delete callback for listen changes
	 */
	public unsubscribe = <K extends keyof EventMap>(event: K, handler: EventMap[K]) => {
		const eventHandlers = this.callbacks.get(event);

		if (eventHandlers !== undefined) {
			eventHandlers.delete(handler);
		}
	};

	public getEventHandlers = <K extends keyof EventMap>(event: K): Set<EventMap[K]> => {
		// const eventHandlers = this.callbacks.get('update');
		// 	if (eventHandlers !== undefined) {
		// 		eventHandlers.forEach((callback) => callback(newData, actualData));
		// 	}
		const eventHandlers = this.callbacks.get(event);
		return eventHandlers === undefined
			? new Set()
			: (eventHandlers as Set<EventMap[K]>);
	};
}
