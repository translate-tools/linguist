import { Event } from 'effector';

import { PageTranslationOptions } from '../PageTranslationContext';
import { PageTranslatorStats } from './PageTranslator';
import { PageTranslatorManager } from './PageTranslatorManager';
import { pageTranslatorStateUpdated } from './requests/pageTranslatorStateUpdated';

export type PageTranslatorState = {
	isTranslated: boolean;
	counters: PageTranslatorStats;
	translateDirection: {
		from: string;
		to: string;
	} | null;
};

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
		this.notifyState();
	}

	public stopTranslate() {
		this.updateTranslationState(null);
		this.notifyState();
	}

	public getStatus(): PageTranslatorState {
		const domTranslator = this.manager.getDomTranslator();
		return {
			isTranslated: domTranslator.isRun(),
			counters: domTranslator.getStatus(),
			translateDirection: domTranslator.getTranslateDirection(),
		};
	}

	private notifyState() {
		pageTranslatorStateUpdated(this.getStatus());
	}
}
