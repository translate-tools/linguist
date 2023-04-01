import { Store } from 'effector';

import { AppConfigType } from '../../../types/runtime';

import { PageTranslationOptions } from '../PageTranslationContext';
import { PageTranslator } from './PageTranslator';

export class PageTranslatorManager {
	private $state;
	private pageTranslator: PageTranslator;

	constructor(
		$state: Store<{
			state: PageTranslationOptions | null;
			config: AppConfigType['pageTranslator'];
		}>,
	) {
		this.$state = $state;

		// Create instances for translation
		const currentState = $state.getState();
		this.pageTranslator = new PageTranslator(currentState.config);
	}

	public getDomTranslator() {
		return this.pageTranslator;
	}

	public start() {
		// Manage page translation instance
		this.$state
			.map(({ config }) => config)
			.watch((config) => {
				if (!this.pageTranslator.isRun()) {
					this.pageTranslator.updateConfig(config);
					return;
				}

				const direction = this.pageTranslator.getTranslateDirection();
				if (direction === null) {
					throw new TypeError(
						'Invalid response from getTranslateDirection method',
					);
				}

				this.pageTranslator.stop();
				this.pageTranslator.updateConfig(config);
				this.pageTranslator.run(direction.from, direction.to);
			});

		// Manage page translation state
		this.$state
			.map(({ state }) => state)
			.watch((pageTranslation) => {
				const shouldTranslate = pageTranslation !== null;
				if (shouldTranslate === this.pageTranslator.isRun()) return;

				if (pageTranslation !== null) {
					this.pageTranslator.run(pageTranslation.from, pageTranslation.to);
				} else {
					this.pageTranslator.stop();
				}
			});
	}
}
