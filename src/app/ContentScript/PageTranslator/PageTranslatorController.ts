import { Event } from 'effector';

import { PageTranslationOptions } from '../PageTranslationContext';
import { PageTranslatorManager } from './PageTranslatorManager';

export class PageTranslatorController {
	private manager: PageTranslatorManager;
	private updateTranslationState: Event<PageTranslationOptions | null>;
	constructor(
		manager: PageTranslatorManager,
		updateTranslationState: Event<PageTranslationOptions | null>,
	) {
		this.manager = manager;
		this.updateTranslationState = updateTranslationState;
	}

	public translate(options: PageTranslationOptions) {
		this.updateTranslationState(options);
	}

	public stopTranslate() {
		this.updateTranslationState(null);
	}

	public getStatus() {
		const domTranslator = this.manager.getDomTranslator();
		return {
			isTranslated: domTranslator.isRun(),
			counters: domTranslator.getStatus(),
			translateDirection: domTranslator.getTranslateDirection(),
		};
	}
}
