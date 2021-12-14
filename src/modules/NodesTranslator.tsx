import { XMutationObserver } from '../lib/XMutationObserver';

interface NodeData {
	/**
	 * Unique identifier of node
	 */
	id: number;

	/**
	 * With each update of node, this value increase
	 */
	updateId: number;

	/**
	 * Context who contains `updateId` when was translate in last time
	 */
	translateContext: number;

	/**
	 * Original text of node, before translate
	 */
	originalText: string;

	priority: number;
}

const searchParent = (
	node: Node,
	callback: (value: Node) => boolean,
	includeSelf = false,
) => {
	// Check self
	if (includeSelf && callback(node)) {
		return node;
	}

	// Check parents
	let lookingNode: Node | null = node;
	while ((lookingNode = lookingNode.parentNode)) {
		if (callback(lookingNode)) {
			break;
		}
	}
	return lookingNode;
};

/**
 * @param handler if return `false`, loop will stop
 */
const nodeExplore = (
	inputNode: Node,
	nodeFilter: number,
	includeSelf: boolean,
	handler: (value: Node) => void | boolean,
) => {
	const walk = document.createTreeWalker(inputNode, nodeFilter, null);
	let node = includeSelf ? walk.currentNode : walk.nextNode();
	while (node) {
		if (handler(node) === false) {
			return;
		}
		node = walk.nextNode();
	}
};

/**
 * Check visibility of element in viewport
 */
export function isInViewport(element: Element, threshold = 0) {
	const { top, left, bottom, right, height, width } = element.getBoundingClientRect();
	const overflows = {
		top,
		left,
		bottom: (window.innerHeight || document.documentElement.clientHeight) - bottom,
		right: (window.innerWidth || document.documentElement.clientWidth) - right,
	};

	if (overflows.top + height * threshold < 0) return false;
	if (overflows.bottom + height * threshold < 0) return false;

	if (overflows.left + width * threshold < 0) return false;
	if (overflows.right + width * threshold < 0) return false;

	return true;
}

type TranslatorInterface = (text: string) => Promise<string>;

interface InnerConfig {
	ignoredTags: Set<string>;
	translatableAttributes: Set<string>;
	lazyTranslate: boolean;
}

export interface Config {
	ignoredTags?: string[];
	translatableAttributes?: string[];
	lazyTranslate?: boolean;
}

// TODO: prioritize nodes to translate - visible text, visible nodes attributes, then text and attributes of nodes out of viewport
// TODO: scan nodes lazy - defer scan to `requestIdleCallback` instead of instant scan
// TODO: describe nodes life cycle

/**
 * Module for dynamic translate a DOM nodes
 */
export class NodesTranslator {
	private readonly translateCallback: TranslatorInterface;
	private readonly config: InnerConfig;

	constructor(translateCallback: TranslatorInterface, config?: Config) {
		this.translateCallback = translateCallback;
		this.config = {
			...config,
			ignoredTags: new Set(
				config?.ignoredTags !== undefined
					? config.ignoredTags.filter(String)
					: [],
			),
			translatableAttributes: new Set(
				config?.translatableAttributes !== undefined
					? config.translatableAttributes.filter(String)
					: [],
			),
			lazyTranslate:
				config?.lazyTranslate !== undefined ? config?.lazyTranslate : true,
		};
	}

	private readonly observedNodesStorage = new Map<Element, XMutationObserver>();
	public observe(node: Element) {
		if (this.observedNodesStorage.has(node)) {
			throw new Error('Node already under observe');
		}

		// Observe node and childs changes
		const observer = new XMutationObserver();
		this.observedNodesStorage.set(node, observer);

		observer.addHandler('elementAdded', ({ target }) => this.addNode(target));
		observer.addHandler('elementRemoved', ({ target }) => this.deleteNode(target));
		observer.addHandler('characterData', ({ target }) => {
			this.updateNode(target);
		});
		observer.addHandler('changeAttribute', ({ target, attributeName }) => {
			if (attributeName === undefined || attributeName === null) return;
			if (!(target instanceof Element)) return;

			const attribute = target.attributes.getNamedItem(attributeName);

			if (attribute === null) return;

			// NOTE: If need delete untracked nodes, we should keep relates like Element -> attributes
			if (!this.nodeStorage.has(attribute)) {
				this.addNode(attribute);
			} else {
				this.updateNode(attribute);
			}
		});

		observer.observe(node);
		this.addNode(node);
	}

	public unobserve(node: Element) {
		if (!this.observedNodesStorage.has(node)) {
			throw new Error('Node is not under observe');
		}

		this.deleteNode(node);
		this.observedNodesStorage.get(node)?.disconnect();
		this.observedNodesStorage.delete(node);
	}

	public getNodeData(node: Node) {
		const nodeData = this.nodeStorage.get(node);
		if (nodeData === undefined) return null;

		const { originalText } = nodeData;
		return { originalText };
	}

	private readonly itersectStorage = new WeakSet<Node>();
	private readonly itersectObserver = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach((entry) => {
				const node = entry.target;
				if (!this.itersectStorage.has(node) || !entry.isIntersecting) return;

				this.itersectStorage.delete(node);
				observer.unobserve(node);
				this.intersectNode(node);
			});
		},
		{ root: null, rootMargin: '0px', threshold: 0 },
	);

	private intersectNode = (node: Element) => {
		// Translate child text nodes and attributes of target node
		// WARNING: we shall not touch inner nodes, because its may still not intersected
		node.childNodes.forEach((node) => {
			if (node instanceof Element || !this.isTranslatableNode(node)) return;
			this.handleNode(node);
		});
	};

	private handleElementByIntersectViewport(node: Element) {
		if (this.itersectStorage.has(node)) return;
		this.itersectStorage.add(node);
		this.itersectObserver.observe(node);
	}

	private idCounter = 0;
	private nodeStorage = new WeakMap<Node, NodeData>();
	private handleNode = (node: Node) => {
		if (this.nodeStorage.has(node)) return;

		// Skip empthy text
		if (node.nodeValue === null || node.nodeValue.trim().length == 0) return;

		// Skip not translatable nodes
		if (!this.isTranslatableNode(node)) return;

		const priority = this.getNodeScore(node);

		this.nodeStorage.set(node, {
			id: this.idCounter++,
			updateId: 1,
			translateContext: 0,
			originalText: '',
			priority,
		});

		// TODO: push to queue instead direct translation
		this.translateNode(node);
	};

	// private addToTranslateQueue = (node: Node, priority: number) => {
	// 	// TODO: add to queue and run executor
	// }

	// private translateQueueExecutor = (node: Node, priority: number) => {
	// 	// TODO: execute translate queue
	// }

	private addNode(node: Node) {
		// Add all nodes which element contains (text nodes and attributes of current and inner elements)
		if (node instanceof Element) {
			this.handleTree(node, (node) => {
				if (node instanceof Element) return;

				if (this.isTranslatableNode(node)) {
					this.addNode(node);
				}
			});

			return;
		}

		// Handle text nodes and attributes

		// Lazy translate when own element intersect viewport
		// But translate at once if node have not parent (virtual node) or parent node is outside of body (utility tags like meta or title)
		if (this.config.lazyTranslate) {
			const isAttachedToDOM = node.getRootNode() !== node;
			const observableNode =
				node instanceof Attr ? node.ownerElement : node.parentElement;

			// Ignore lazy translation for not intersectable nodes and translate it immediately
			if (
				isAttachedToDOM &&
				observableNode !== null &&
				this.isIntersectableNode(observableNode)
			) {
				this.handleElementByIntersectViewport(observableNode);
				return;
			}
		}

		// Add to storage
		this.handleNode(node);
	}

	private deleteNode(node: Node, onlyTarget = false) {
		if (node instanceof Element) {
			// Delete all attributes and inner nodes
			if (!onlyTarget) {
				this.handleTree(node, (node) => {
					this.deleteNode(node, true);
				});
			}

			// Unobserve
			this.itersectStorage.delete(node);
			this.itersectObserver.unobserve(node);
		}

		const nodeData = this.nodeStorage.get(node);
		if (nodeData !== undefined) {
			// Restore original text
			node.nodeValue = nodeData.originalText;
			this.nodeStorage.delete(node);
		}
	}

	// Updates never be lazy
	private updateNode(node: Node) {
		const nodeData = this.nodeStorage.get(node);
		if (nodeData !== undefined) {
			nodeData.updateId++;
			this.translateNode(node);
		}
	}

	/**
	 * Call only for new and updated nodes
	 */
	private translateNode(node: Node) {
		const nodeData = this.nodeStorage.get(node);
		if (nodeData === undefined) {
			throw new Error('Node is not register');
		}

		if (node.nodeValue === null) return;

		// Recursion prevention
		if (nodeData.updateId <= nodeData.translateContext) {
			return;
		}

		const nodeId = nodeData.id;
		const nodeContext = nodeData.updateId;
		return this.translateCallback(node.nodeValue).then((text) => {
			const actualNodeData = this.nodeStorage.get(node);
			if (actualNodeData === undefined || nodeId !== actualNodeData.id) {
				return;
			}
			if (nodeContext !== actualNodeData.updateId) {
				return;
			}

			// actualNodeData.translateData = text;
			actualNodeData.originalText = node.nodeValue !== null ? node.nodeValue : '';
			actualNodeData.translateContext = actualNodeData.updateId + 1;
			node.nodeValue = text;
			return node;
		});
	}

	private isTranslatableNode(targetNode: Node) {
		let targetToParentsCheck: Element | null = null;

		// Check node type and filters for its type
		if (targetNode instanceof Element) {
			if (this.config.ignoredTags.has(targetNode.localName)) {
				return false;
			}

			targetToParentsCheck = targetNode;
		} else if (targetNode instanceof Attr) {
			if (!this.config.translatableAttributes.has(targetNode.name)) {
				return false;
			}

			targetToParentsCheck = targetNode.ownerElement;
		} else if (targetNode instanceof Text) {
			targetToParentsCheck = targetNode.parentElement;
		} else {
			return false;
		}

		// Check parents to ignore
		if (targetToParentsCheck !== null) {
			const ignoredParent = searchParent(
				targetToParentsCheck,
				(node: Node) =>
					node instanceof Element &&
					this.config.ignoredTags.has(node.localName),
				true,
			);

			if (ignoredParent !== null) {
				return false;
			}
		}

		// We can't proof that node is not translatable
		return true;
	}

	private isIntersectableNode = (node: Element) => {
		return document.body.contains(node);
	};

	private getNodeScore = (node: Node) => {
		let score = 0;

		if (node instanceof Attr) {
			score += 1;
			const parent = node.ownerElement;
			if (parent && isInViewport(parent)) {
				score += 1;
			}
		} else if (node instanceof Text) {
			score += 2;
			const parent = node.parentElement;
			if (parent && isInViewport(parent)) {
				score += 1;
			}
		}

		return score;
	};

	/**
	 * Handle all translatable nodes from element
	 * Element, Attr, Text
	 */
	private handleTree(node: Element, callback: (node: Node) => void) {
		nodeExplore(node, NodeFilter.SHOW_ALL, true, (node) => {
			callback(node);

			if (node instanceof Element) {
				// Handle nodes from opened shadow DOM
				if (node.shadowRoot !== null) {
					for (const child of Array.from(node.shadowRoot.children)) {
						this.handleTree(child, callback);
					}
				}

				// Handle attributes of element
				for (const attribute of Object.values(node.attributes)) {
					callback(attribute);
				}
			}
		});
	}
}
