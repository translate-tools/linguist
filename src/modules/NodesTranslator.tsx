import { ShadowDOMContainerManager } from '../lib/ShadowDOMContainerManager';
import { XMutationObserver } from '../lib/XMutationObserver';
import { Popup } from '../components/Popup/Popup';
import React from 'react';

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
}

const searchParent = (node: Node, callback: (value: Node) => boolean) => {
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

const showOriginalTextByHover = true;

function isBlockElement(element: Element) {
	const blockTypes = ['block', 'flex', 'grid', 'table', 'table-row', 'list-item'];
	const display = getComputedStyle(element).display;

	return blockTypes.indexOf(display) !== -1;
}

/**
 * Module for dynamic translate a DOM nodes
 */
export class NodesTranslator {
	translateCallback: TranslatorInterface;
	config: InnerConfig;

	constructor(translateCallback: TranslatorInterface, config?: Config) {
		this.translateCallback = translateCallback;
		this.config = {
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

	private observedNodesStorage = new Map<Element, XMutationObserver>();
	observe(node: Element) {
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

		if (showOriginalTextByHover) {
			document.addEventListener('mouseover', this.showOriginalTextHandler);
		}
	}

	unobserve(node: Element) {
		if (!this.observedNodesStorage.has(node)) {
			throw new Error('Node is not under observe');
		}

		this.deleteNode(node);
		this.observedNodesStorage.get(node)?.disconnect();
		this.observedNodesStorage.delete(node);

		if (showOriginalTextByHover) {
			document.removeEventListener('mouseover', this.showOriginalTextHandler);
		}
	}

	private readonly shadowRoot = new ShadowDOMContainerManager({
		styles: ['common.css', 'contentscript.css'],
	});

	private showOriginalTextHandler = (evt: MouseEvent) => {
		const target: Element = evt.target as Element;

		const getTextOfElement = (element: Node) => {
			let text = '';

			if (element instanceof Text) {
				text += this.nodeStorage.get(element)?.originalText ?? '';
			} else if (element instanceof Element) {
				for (const node of Array.from(element.childNodes)) {
					if (node instanceof Text) {
						text += this.nodeStorage.get(node)?.originalText ?? '';
					} else if (node instanceof Element && !isBlockElement(node)) {
						text += getTextOfElement(node);
					} else {
						break;
					}
				}
			}

			return text;
		};

		// Create root node
		if (this.shadowRoot.getRootNode() === null) {
			this.shadowRoot.createRootNode();
		}

		// TODO: show popup with text after delay. Don't show if text is empty
		const text = getTextOfElement(target);

		// TODO: refactor me
		if (text) {
			this.shadowRoot.mountComponent(
				<Popup
					target="anchor"
					anchor={{ current: target }}
					view="default"
					visible={true}
					zIndex={999}
				>
					<div
						// TODO: use class
						style={{
							background: '#eee',
							color: '#000',
							padding: '1rem',
							maxWidth: '400px',
						}}
					>
						{text}
					</div>
				</Popup>,
			);
		} else {
			this.shadowRoot.unmountComponent();
		}
	};

	private readonly itersectStorage = new WeakSet<Node>();
	private readonly itersectObserver = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach((entry) => {
				const node = entry.target;
				if (!this.itersectStorage.has(node) || !entry.isIntersecting) return;

				this.itersectStorage.delete(node);
				observer.unobserve(node);
				this.addNode(node, true);
			});
		},
		{ root: null, rootMargin: '0px', threshold: 1.0 },
	);

	private handleElementByIntersectViewport(node: Element) {
		if (this.itersectStorage.has(node)) return;
		this.itersectStorage.add(node);
		this.itersectObserver.observe(node);
	}

	private idCounter = 0;
	private nodeStorage = new WeakMap<Node, NodeData>();
	private addNode(node: Node, force = false) {
		// Add attributes and text nodes from element
		if (node instanceof Element) {
			this.handleTree(node, (node) => {
				if (
					node.nodeValue !== null &&
					node.nodeValue.trim().length > 0 &&
					this.isTranslatableNode(node)
				) {
					this.addNode(node, force);
				}
			});
			return;
		}

		// Lazy translate when own element intersect viewport
		// But translate at once if node have not parent (virtual node) or parent node is outside of body (utility tags like meta or title)
		const owner = node.parentElement;
		if (
			this.config.lazyTranslate &&
			!force &&
			owner !== null &&
			document.body.contains(owner)
		) {
			this.handleElementByIntersectViewport(owner);
			return;
		}

		if (this.nodeStorage.has(node)) return;

		// Skip: Empthy text
		if (node.nodeValue === null || node.nodeValue.trim().length == 0) return;

		// WARNING: this check with looking for parent too expensive
		// You should not do it If you can guarante that method will not call for ignored tags

		// Skip: Inappropriate nodes
		let parent;
		if (node instanceof Text) {
			parent = node.parentElement;
		} else if (node instanceof Attr) {
			if (!this.config.translatableAttributes.has(node.name)) return;
			parent = node.ownerElement;
		} else {
			return;
		}

		// Skip: Content from ignored tags
		if (parent === null || !this.isTranslatableNode(parent)) return;

		// Add to storage
		this.nodeStorage.set(node, {
			id: this.idCounter++,
			updateId: 1,
			translateContext: 0,
			originalText: '',
		});

		this.translateNode(node);
	}

	private deleteNode(node: Node) {
		// Delete attributes and text nodes from element
		if (node instanceof Element) {
			this.handleTree(node, (node) => {
				if (this.nodeStorage.has(node)) {
					this.deleteNode(node);
				}
			});
			return;
		}

		const nodeData = this.nodeStorage.get(node);
		if (nodeData === undefined) return;
		node.nodeValue = nodeData.originalText;
		this.nodeStorage.delete(node);
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
		if (
			targetNode instanceof Element &&
			this.config.ignoredTags.has(targetNode.localName)
		) {
			return false;
		}

		if (
			targetNode instanceof Attr &&
			!this.config.translatableAttributes.has(targetNode.name)
		) {
			return false;
		}

		const ignoredParent = searchParent(
			targetNode,
			(node) =>
				node instanceof Element && this.config.ignoredTags.has(node.localName),
		);

		if (ignoredParent !== null) {
			return false;
		}

		return true;
	}

	/**
	 * Handle all translatable nodes from element
	 * Element, Attr, Text
	 */
	private handleTree(node: Element, callback: (node: Node) => void) {
		nodeExplore(node, NodeFilter.SHOW_ALL, true, (node) => {
			callback(node);

			// Handle attributes of element
			if (node instanceof Element) {
				for (const attribute of Object.values(node.attributes)) {
					callback(attribute);
				}
			}
		});
	}
}
