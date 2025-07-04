import React from 'react';
import {
	DOMTranslator,
	INodesTranslator,
	IntersectionScheduler,
	NodesTranslator,
	PersistentDOMTranslator,
} from 'domtranslator';
import {
	configureTranslatableNodePredicate,
	isElementNode,
	isTextNode,
} from 'domtranslator/utils/nodes';

import { ShadowDOMContainerManager } from '../../../lib/ShadowDOMContainerManager';
import { translate } from '../../../requests/backend/translate';
import { AppConfigType } from '../../../types/runtime';

import { OriginalTextPopup } from './components/OriginalTextPopup/OriginalTextPopup';
import { pageTranslatorStatsUpdated } from './requests/pageTranslatorStatsUpdated';

export type PageTranslatorStats = {
	resolved: number;
	rejected: number;
	pending: number;
};

function isBlockElement(element: Element) {
	const blockTypes = ['block', 'flex', 'grid', 'table', 'table-row', 'list-item'];
	const display = getComputedStyle(element).display;

	return blockTypes.indexOf(display) !== -1;
}

type PageTranslatorConfig = Partial<
	Pick<
		AppConfigType['pageTranslator'],
		'originalTextPopup' | 'translatableAttributes' | 'ignoredTags' | 'lazyTranslate'
	>
>;

// TODO: rewrite to augmentation
export class PageTranslator {
	private translateContext = Symbol();

	private pageTranslator: {
		persistentDomTranslator: PersistentDOMTranslator;
		nodesTranslator: INodesTranslator;
	} | null = null;
	private pageTranslateDirection: { from: string; to: string } | null = null;
	private translateState: PageTranslatorStats = {
		resolved: 0,
		rejected: 0,
		pending: 0,
	};

	private config: PageTranslatorConfig = {};
	constructor(config: PageTranslatorConfig) {
		this.updateConfig(config);
	}

	public updateConfig(config: PageTranslatorConfig) {
		this.config = { ...this.config, ...config };
	}

	public isRun() {
		return this.pageTranslator !== null;
	}

	public getStatus() {
		return this.translateState;
	}

	public getTranslateDirection() {
		return this.pageTranslateDirection;
	}

	public run(from: string, to: string) {
		if (this.pageTranslator !== null) {
			throw new Error('Page already translated');
		}

		this.translateContext = Symbol();
		const localContext = this.translateContext;

		// Create local reference to object for decrease risc mutation
		const localTranslateState = this.translateState;
		const translateText = async (text: string, priority: number) => {
			if (localContext !== this.translateContext) {
				throw new Error('Outdated context');
			}

			localTranslateState.pending++;
			this.translateStateUpdate();

			return translate(text, from, to, { priority })
				.then((translatedText) => {
					if (localContext === this.translateContext) {
						localTranslateState.resolved++;
					}

					return translatedText;
				})
				.catch((reason) => {
					if (localContext === this.translateContext) {
						localTranslateState.rejected++;
					}

					throw reason;
				})
				.finally(() => {
					if (localContext === this.translateContext) {
						localTranslateState.pending--;
						this.translateStateUpdate();
					}
				});
		};

		this.pageTranslateDirection = { from, to };

		const nodesTranslator = new NodesTranslator(translateText);
		this.pageTranslator = {
			nodesTranslator,
			persistentDomTranslator: new PersistentDOMTranslator(
				new DOMTranslator(
					// Nodes will be translated with fake translator,
					// that is just adds a text prefix to original text
					nodesTranslator,
					{
						// When `scheduler` is provided, a lazy translation mode will be used.
						// Nodes will be translated only when intersects a viewport
						scheduler: this.config.lazyTranslate
							? new IntersectionScheduler()
							: undefined,

						// Filter will skip nodes that must not be translated
						filter: configureTranslatableNodePredicate({
							// Only listed attributes will be translated
							translatableAttributes: this.config.translatableAttributes,
							// Any elements not included in list will be translated
							ignoredSelectors: (this.config.ignoredTags ?? []).filter(
								(selector) => {
									// Skip comments
									if (selector.startsWith('!')) return false;

									// Skip empty strings
									if (selector.trim().length === 0) return false;

									return true;
								},
							),
						}),
					},
				),
			),
		};

		this.pageTranslator.persistentDomTranslator.translate(document.documentElement);

		if (this.config.originalTextPopup) {
			document.addEventListener('mouseover', this.showOriginalTextHandler);
		}
	}

	public stop() {
		if (this.pageTranslator === null) {
			throw new Error('Page is not translated');
		}

		this.pageTranslator.persistentDomTranslator.restore(document.documentElement);
		this.pageTranslator = null;
		this.pageTranslateDirection = null;

		this.translateContext = Symbol();
		this.translateState = {
			resolved: 0,
			rejected: 0,
			pending: 0,
		};
		this.translateStateUpdate();

		if (this.config.originalTextPopup) {
			document.removeEventListener('mouseover', this.showOriginalTextHandler);
			this.shadowRoot.unmountComponent();
		}
	}

	private readonly shadowRoot = new ShadowDOMContainerManager({
		styles: ['contentscript.css'],
	});

	private showOriginalTextHandler = (evt: MouseEvent) => {
		const target: Element = evt.target as Element;

		const getTextOfElement = (element: Node) => {
			let text = '';

			if (isTextNode(element)) {
				text +=
					this.pageTranslator?.nodesTranslator.getState(element)
						?.originalText ?? '';
			} else if (isElementNode(element)) {
				for (const node of Array.from(element.childNodes)) {
					if (isTextNode(node)) {
						text +=
							this.pageTranslator?.nodesTranslator.getState(node)
								?.originalText ?? '';
					} else if (isElementNode(node) && !isBlockElement(node)) {
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

		// TODO: show popup with text after delay
		const text = getTextOfElement(target);
		if (text) {
			// TODO: consider viewport boundaries
			this.shadowRoot.mountComponent(
				<OriginalTextPopup target={{ current: target as HTMLElement }}>
					{text}
				</OriginalTextPopup>,
			);
		} else {
			this.shadowRoot.unmountComponent();
		}
	};

	/**
	 * For reduce re-render frequency on client
	 */
	private readonly updateTimeout = 100;
	private lastSentUpdate = 0;
	private timer: number | null = null;
	private translateStateUpdate = () => {
		if (this.timer !== null) return;

		const sendUpdate = () => {
			this.lastSentUpdate = new Date().getTime();
			pageTranslatorStatsUpdated(this.translateState);
		};

		const now = new Date().getTime();
		const idleTime = now - this.lastSentUpdate;
		if (idleTime >= this.updateTimeout) {
			sendUpdate();
		} else {
			this.timer = window.setTimeout(() => {
				this.timer = null;
				sendUpdate();
			}, this.updateTimeout - idleTime);
		}
	};
}
