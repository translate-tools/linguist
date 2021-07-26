import { NodesTranslator, Config as NodesTranslatorConfig } from '../NodesTranslator';

import { translate } from '../../requests/backend/translate';
import { translateStateUpdate } from './requests';

export type PageTranslateState = {
	resolved: number;
	rejected: number;
	pending: number;
};

export class PageTranslator {
	private translateContext = Symbol();
	private pageTranslator: NodesTranslator | null = null;
	private pageTranslateDirection: { from: string; to: string } | null = null;
	private translateState: PageTranslateState = {
		resolved: 0,
		rejected: 0,
		pending: 0,
	};

	private config: NodesTranslatorConfig;
	constructor(config: NodesTranslatorConfig) {
		this.config = config;
	}

	public updateConfig(config: NodesTranslatorConfig) {
		this.config = config;
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
		const translateText = async (text: string) => {
			if (localContext !== this.translateContext) {
				throw new Error('Outdated context');
			}

			localTranslateState.pending++;
			this.translateStateUpdate();

			return translate(text, from, to)
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
		this.pageTranslator = new NodesTranslator(translateText, this.config);
		this.pageTranslator.observe(document.documentElement);
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
	}

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
			translateStateUpdate(this.translateState);
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
