import { Store } from 'effector';

import { AppConfigType } from '../../types/runtime';
import { PageData } from '../ContentScript/PageTranslationContext';
import { SelectTranslator, Options as SelectTranslatorOptions } from './SelectTranslator';

export const buildSelectTranslatorOptions = (
	{ mode, ...options }: AppConfigType['selectTranslator'],
	{ pageLanguage }: { pageLanguage?: string },
): SelectTranslatorOptions => ({
	...options,
	pageLanguage,
	quickTranslate: mode === 'quickTranslate',
	enableTranslateFromContextMenu: mode === 'contextMenu',
});

export class SelectTranslatorManager {
	private $state;
	constructor(
		$state: Store<{
			enabled: boolean;
			config: AppConfigType['selectTranslator'];
			pageData: PageData;
		}>,
	) {
		this.$state = $state;
	}

	private selectTranslator: SelectTranslator | null = null;

	public getSelectTranslator() {
		return this.selectTranslator;
	}

	public start() {
		// Manage text translation instance
		this.$state.watch(({ config: preferences, pageData }) => {
			console.warn('TT prefs', preferences);

			if (preferences.enabled) {
				const pageLanguage = pageData.language || undefined;
				const config = buildSelectTranslatorOptions(preferences, {
					pageLanguage,
				});

				if (this.selectTranslator === null) {
					this.selectTranslator = new SelectTranslator(config);
				} else {
					const isRun = this.selectTranslator.isRun();
					if (isRun) {
						this.selectTranslator.stop();
					}

					this.selectTranslator = new SelectTranslator(config);

					if (isRun) {
						this.selectTranslator.start();
					}
				}
			} else {
				if (this.selectTranslator === null) return;

				if (this.selectTranslator.isRun()) {
					this.selectTranslator.stop();
				}

				this.selectTranslator = null;
			}
		});

		// Manage text translation state
		const $isTextTranslationStarted = this.$state.map(({ enabled }) => enabled);
		$isTextTranslationStarted.watch((isTranslating) => {
			console.warn('TT state', isTranslating);

			if (this.selectTranslator === null) return;
			if (isTranslating === this.selectTranslator.isRun()) return;

			if (isTranslating) {
				this.selectTranslator.start();
			} else {
				this.selectTranslator.stop();
			}
		});
	}
}
