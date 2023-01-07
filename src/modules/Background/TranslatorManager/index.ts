import {
	IScheduler,
	Scheduler,
	SchedulerWithCache,
} from '@translate-tools/core/util/Scheduler';
import { BaseTranslator } from '@translate-tools/core/types/Translator';
import { TranslatorClass } from '@translate-tools/core/types/Translator';

import { AppConfigType } from '../../../types/runtime';

import { TranslatorsCacheStorage } from '../TranslatorsCacheStorage';
import { TranslatorsMap } from '..';

export type Config = Pick<AppConfigType, 'translatorModule' | 'scheduler' | 'cache'>;

/**
 * Build and manage a translation scheduler
 */
export class TranslatorManager {
	private config: Config;
	private translators: TranslatorsMap = {};
	constructor(config: Config, translators: TranslatorsMap) {
		this.config = config;
		this.translators = translators;
	}

	public setConfig(config: Config) {
		this.config = config;
		this.getTranslationSchedulerInstance(true);
	}

	public setTranslators(customTranslators: TranslatorsMap) {
		this.translators = customTranslators;
		this.getTranslationSchedulerInstance(true);
	}

	/**
	 * Return map with available translators
	 */
	public getTranslators = (): TranslatorsMap => {
		return this.translators;
	};

	public getTranslatorFeatures = () => {
		const translatorClass = this.getTranslatorClass();
		return {
			supportedLanguages: translatorClass.getSupportedLanguages(),
			isSupportAutodetect: translatorClass.isSupportedAutoFrom(),
		};
	};

	/**
	 * Return configured translation scheduler
	 */
	public getScheduler() {
		return this.getTranslationSchedulerInstance();
	}

	private schedulerInstance: IScheduler | null = null;
	private getTranslationSchedulerInstance = (forceCreate = false) => {
		if (this.schedulerInstance === null || forceCreate) {
			const translator = this.getTranslator();

			const { useCache, ...schedulerConfig } = this.config.scheduler;

			const scheduler = new Scheduler(translator, schedulerConfig);

			let schedulerInstance: IScheduler = scheduler;
			if (useCache) {
				// Wrap scheduler by cache
				const cacheInstance = this.getCache();
				schedulerInstance = new SchedulerWithCache(scheduler, cacheInstance);
			}

			this.schedulerInstance = schedulerInstance;
		}

		return this.schedulerInstance;
	};

	private getTranslator = () => {
		const translatorClass = this.getTranslatorClass();
		return new translatorClass();
	};

	private getCache = () => {
		const { translatorModule, cache } = this.config;
		return new TranslatorsCacheStorage(translatorModule, cache);
	};

	private getTranslatorClass = (): TranslatorClass<BaseTranslator> => {
		const { translatorModule } = this.config;

		const translators = this.getTranslators();
		const translatorClass = translators[translatorModule];
		if (translatorClass === undefined) {
			throw new Error(`Not found translator "${translatorModule}"`);
		}

		return translatorClass as TranslatorClass<BaseTranslator>;
	};
}
