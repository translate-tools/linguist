import { isEqual } from 'lodash';

// Translators
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import { YandexTranslator } from '@translate-tools/core/translators/YandexTranslator';
import { BingTranslatorPublic } from '@translate-tools/core/translators/unstable/BingTranslatorPublic';
import { TranslatorClass } from '@translate-tools/core/types/Translator';

import { AppConfigType } from '../../types/runtime';
import { createSelector } from '../../lib/effector/createSelector';
import {
	createPromiseWithControls,
	PromiseWithControls,
} from '../../lib/utils/createPromiseWithControls';
import { getTranslatorsClasses } from '../../requests/backend/translators';

import { ObservableAsyncStorage } from '../ConfigStorage/ConfigStorage';
import { TranslatorManager } from './TranslatorManager';

export const embeddedTranslators = {
	YandexTranslator,
	GoogleTranslator,
	BingTranslatorPublic,
} as const;

/**
 * Format custom translator unique id as key to use with another translators
 */
export const getFormattedCustomTranslatorId = (id: number) => '#' + id;

/**
 * Map where key is identifier of translator and value is translator constructor
 */
export type TranslatorsMap = Record<string, TranslatorClass>;

/**
 * Background features manager
 */
export class Background {
	private readonly config: ObservableAsyncStorage<AppConfigType>;
	constructor(config: ObservableAsyncStorage<AppConfigType>) {
		this.config = config;
	}

	private translateManager: TranslatorManager | null = null;
	private translateManagerPromise: PromiseWithControls<TranslatorManager> | null = null;
	public async getTranslateManager() {
		if (this.translateManager === null) {
			// Create promise to await configuring instance
			if (this.translateManagerPromise === null) {
				const promiseWithControls =
					createPromiseWithControls<TranslatorManager>();

				// Set promise
				this.translateManagerPromise = promiseWithControls;

				// Clear promise
				promiseWithControls.promise.finally(() => {
					if (promiseWithControls === this.translateManagerPromise) {
						this.translateManagerPromise = null;
					}
				});
			}

			return this.translateManagerPromise.promise;
		}

		return this.translateManager;
	}

	public async start() {
		const $config = await this.config.getObservableStore();
		const $translateManagerConfig = createSelector(
			$config,
			({ scheduler, translatorModule, cache }) => ({
				scheduler,
				translatorModule,
				cache,
			}),
			{
				updateFilter: (update, state) => !isEqual(update, state),
			},
		);

		// Build translators list
		const translators: TranslatorsMap = await getTranslatorsClasses();

		$translateManagerConfig.watch((config) => {
			if (this.translateManager === null) {
				this.translateManager = new TranslatorManager(config, translators);

				// Return a scheduler instance for awaiters
				if (this.translateManagerPromise !== null) {
					this.translateManagerPromise.resolve(this.translateManager);
				}
				return;
			}

			this.translateManager.setConfig(config);
		});
	}
}
