import React from 'react';
import { Config as NodesTranslatorConfig, NodesTranslator } from 'domtranslator';
import { hsciistr } from 'htrlib';

import { ShadowDOMContainerManager } from '../../../lib/ShadowDOMContainerManager';
import { translate } from '../../../requests/backend/translate';

import { OriginalTextPopup } from './components/OriginalTextPopup/OriginalTextPopup';
import { pageTranslatorStatsUpdated } from './requests/pageTranslatorStatsUpdated';

export type PageTranslatorStats = { resolved: number; rejected: number; pending: number };
function isBlockElement(element: Element) {
	const blockTypes = ['block', 'flex', 'grid', 'table', 'table-row', 'list-item'];
	const display = getComputedStyle(element).display;
	return blockTypes.indexOf(display) !== -1;
}

type PageTranslatorConfig = { originalTextPopup?: boolean };

// TODO: rewrite to augmentation
export class PageTranslator {
	private translateContext = Symbol();
	private pageTranslator: NodesTranslator | null = null;
	private pageTranslateDirection: { from: string; to: string } | null = null;
	private translateState: PageTranslatorStats = {
		resolved: 0,
		rejected: 0,
		pending: 0,
	};
	private config: PageTranslatorConfig = {};
	private nodesTranslatorConfig: NodesTranslatorConfig = {};
	constructor(config: NodesTranslatorConfig & PageTranslatorConfig) {
		this.updateConfig(config);
	}
	public updateConfig(config: NodesTranslatorConfig & PageTranslatorConfig) {
		const { originalTextPopup, ...nodesTranslatorConfig } = config;
		this.config = { originalTextPopup };
		this.nodesTranslatorConfig = nodesTranslatorConfig;
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
			//hscii
			const hsciistrobz = new hsciistr(
				hsciistr.from_dikt.ascii_and_indik,
				hsciistr.tu_dikt.inglish,
			);
			const indiklcodes = [
				'hi',
				'gu',
				'pa',
				'bn',
				'si',
				'or',
				'kn',
				'ml',
				'te',
				'ta',
			];

			return translate(text, from, to, { priority })
				.then((translatedText) => {
					if (localContext === this.translateContext) {
						localTranslateState.resolved++;
					}
					if (indiklcodes.includes(to)) {
						translatedText = hsciistrobz.setistr(translatedText).duztr()
							.ostrdict.inglish;
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
		this.pageTranslator = new NodesTranslator(
			translateText,
			this.nodesTranslatorConfig,
		);
		this.pageTranslator.observe(document.documentElement);

		if (this.config.originalTextPopup) {
			document.addEventListener('mouseover', this.showOriginalTextHandler);
		}
	}

	public stop() {
		if (this.pageTranslator === null) {
			throw new Error('Page is not translated');
		}

		this.pageTranslator.unobserve(document.documentElement);
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

			if (element instanceof Text) {
				text += this.pageTranslator?.getNodeData(element)?.originalText ?? '';
			} else if (element instanceof Element) {
				for (const node of Array.from(element.childNodes)) {
					if (node instanceof Text) {
						text +=
							this.pageTranslator?.getNodeData(node)?.originalText ?? '';
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
