import { isEqual } from 'lodash';

// Translators
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import { YandexTranslator } from '@translate-tools/core/translators/YandexTranslator';
import { BingTranslatorPublic } from '@translate-tools/core/translators/unstable/BingTranslatorPublic';
import { TranslatorClass } from '@translate-tools/core/types/Translator';

import { AppConfigType } from '../../types/runtime';
import { createSelector } from '../../lib/effector/createSelector';
import { createPromiseWithControls, PromiseWithControls } from '../../lib/utils';
import { ObservableAsyncStorage } from '../ConfigStorage/ConfigStorage';
import { getCustomTranslatorsClasses } from '../../requests/backend/translators/applyTranslators';
import { TranslatorManager } from './TranslatorManager';

export const translatorModules = {
	YandexTranslator,
	GoogleTranslator,
	BingTranslatorPublic,
} as const;

export const DEFAULT_TRANSLATOR = 'GoogleTranslator';

/**
 * Format custom translator unique id as key to use with another translators
 */
export const getFormattedCustomTranslatorId = (id: number) => '#' + id;

/**
 * Map where key is identifier of translator and value is translator constructor
 */
export type TranslatorsMap = Record<string, TranslatorClass>;

/**
 * Receive custom translators map and return new map with formatted keys
 */
export const getCustomTranslatorsMapWithFormattedKeys = (
	customTranslators: Record<number, TranslatorClass>,
) => {
	const translatorsMap: TranslatorsMap = {};
	for (const key in customTranslators) {
		const translatorId = getFormattedCustomTranslatorId(Number(key));
		const translatorClass = customTranslators[key];

		translatorsMap[translatorId] = translatorClass;
	}

	return translatorsMap;
};

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
		const translators = await getCustomTranslatorsClasses().then(
			(customTranslators) => {
				return {
					...translatorModules,
					...getCustomTranslatorsMapWithFormattedKeys(customTranslators),
				};
			},
		);

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
