type EventNameNodeMutations = 'elementAdded' | 'elementRemoved' | 'elementMoved';
type EventName = 'characterData' | 'changeAttribute' | EventNameNodeMutations;

type CallbackData = {
	target: Node;
	oldValue?: string | null;
	attributeName?: string | null;
};
type Callback = (value: CallbackData) => void;

type NodeCounters = {
	added: number;
	removed: number;
};

/**
 * Wrap for MutationObserver with features
 * - Tracking real changes. You can ignore mutation sequences like [delete, add] who happens with moved DOM nodes
 * - Adding listeners by event names
 */
export class XMutationObserver {
	private readonly handlers = new Map<EventName, Set<Callback>>();
	private callHandlers(eventName: EventName, params: CallbackData) {
		const handlers = this.handlers.get(eventName);
		if (handlers !== undefined) {
			handlers.forEach((fn: Callback) => fn(params));
		}
	}

	private observerHandler = (mutations: MutationRecord[]) => {
		const nodeCounters = new Map<Node, NodeCounters>();

		mutations.forEach((mutation) => {
			switch (mutation.type) {
				case 'characterData': {
					this.callHandlers('characterData', {
						target: mutation.target,
						oldValue: mutation.oldValue,
					});
					break;
				}

				case 'attributes': {
					this.callHandlers('changeAttribute', {
						target: mutation.target,
						oldValue: mutation.oldValue,
						attributeName: mutation.attributeName,
					});
					break;
				}

				case 'childList': {
					// write all changes

					mutation.removedNodes.forEach((node) => {
						const counters = nodeCounters.get(node);
						if (counters !== undefined) {
							counters.removed++;
						} else {
							nodeCounters.set(node, {
								added: 0,
								removed: 1,
							});
						}
					});

					mutation.addedNodes.forEach((node) => {
						const counters = nodeCounters.get(node);
						if (counters !== undefined) {
							counters.added++;
						} else {
							nodeCounters.set(node, {
								added: 1,
								removed: 0,
							});
						}
					});
					break;
				}
			}
		});

		// call handlers if have changes
		nodeCounters.forEach(({ added, removed }, node) => {
			const data = {
				target: node,
			};

			if (added > removed) {
				this.callHandlers('elementAdded', data);
			} else if (added < removed) {
				this.callHandlers('elementRemoved', data);
			} else {
				this.callHandlers('elementMoved', data);
			}
		});
	};

	private readonly observer = new MutationObserver(this.observerHandler);

	observe(node: Element) {
		this.observer.observe(node, {
			attributeOldValue: true,
			characterDataOldValue: true,
			childList: true,
			characterData: true,
			subtree: true,
		});
	}

	disconnect() {
		this.observer.disconnect();
	}

	addHandler(eventName: EventName, callback: Callback) {
		if (!this.handlers.has(eventName)) {
			this.handlers.set(eventName, new Set());
		}

		const handlers = this.handlers.get(eventName);
		handlers?.add(callback);
	}

	removeHandler(eventName: EventName, callback: Callback) {
		const handlers = this.handlers.get(eventName);
		if (handlers !== undefined) {
			handlers.delete(callback);
		}
	}
}
