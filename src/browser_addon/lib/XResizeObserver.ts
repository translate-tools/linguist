type Parameters = {
	width: number;
	height: number;
};

type HandlerCallback = (node: Element, data: Parameters) => void;

type NodeData = {
	data: Parameters | null;
	handlers: Set<HandlerCallback>;
};

type SizeGetter = (node: Element) => Parameters;

type Options = {
	/**
	 * Function return properties for check. Such as width, height
	 */
	sizeGetter?: SizeGetter;
};

/**
 * Extended observer who can handle any size changes of elements.
 * Different of ResizeObserver who track clientWidth/clientHeight properties,
 * this class allow set target of observation. For example scrollWidth/scrollHeight (by default).
 *
 * @requires requestAnimationFrame
 * @requires Set
 * @requires WeakMap
 * @requires WeakSet
 */
export class XResizeObserver {
	private readonly registry = new WeakMap<Element, NodeData>();

	private readonly getSize: SizeGetter = (node: Element) => ({
		height: node.scrollHeight,
		width: node.scrollWidth,
	});

	constructor(options?: Options) {
		const customSizeGetter = options?.sizeGetter;
		if (customSizeGetter !== undefined) {
			this.getSize = customSizeGetter;
		}
	}

	private loopRegistry = new WeakSet<Element>();
	private runLoop = (node: Element) => {
		if (this.loopRegistry.has(node)) return;

		const loop = () => {
			const nodeStorage = this.registry.get(node);
			if (nodeStorage === undefined) {
				// Stop loop
				this.loopRegistry.delete(node);
				return;
			}

			const { width, height } = this.getSize(node);

			let isResized = false;
			if (nodeStorage.data === null) {
				isResized = true;
			} else if (
				nodeStorage.data.height !== height ||
				nodeStorage.data.width !== width
			) {
				isResized = true;
			}

			if (isResized) {
				const newData = { width, height };
				nodeStorage.data = newData;
				nodeStorage.handlers.forEach((callback) => {
					callback(node, { ...newData });
				});
			}

			requestAnimationFrame(loop);
		};

		// Start loop
		this.loopRegistry.add(node);
		loop();
	};

	addHandler(node: Element, callback: HandlerCallback) {
		if (!this.registry.has(node)) {
			this.registry.set(node, {
				data: null,
				handlers: new Set<HandlerCallback>(),
			});

			this.runLoop(node);
		}

		const nodeStorage = this.registry.get(node);
		if (nodeStorage === undefined) return;

		const nodeHandlers = nodeStorage.handlers;
		if (nodeHandlers === undefined) return;

		if (!nodeHandlers.has(callback)) {
			nodeHandlers.add(callback);
		}
	}

	deleteHandler(node: Element, callback: HandlerCallback) {
		const nodeStorage = this.registry.get(node);
		if (nodeStorage === undefined) return;

		const nodeHandlers = nodeStorage.handlers;
		if (nodeHandlers === undefined) return;

		nodeHandlers.delete(callback);
	}

	purgeHandlers(node: Element) {
		const nodeStorage = this.registry.get(node);
		if (nodeStorage === undefined) return;

		nodeStorage.handlers = new Set<HandlerCallback>();
	}
}
