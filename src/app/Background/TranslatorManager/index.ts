import { isLanguageCodeISO639v1 } from '@translate-tools/core/languages';
import {
	IScheduler,
	Scheduler,
	SchedulerWithCache,
} from '@translate-tools/core/scheduling';

import { AppConfigType } from '../../../types/runtime';
import { RecordValues } from '../../../types/utils';

import { TranslatorsCacheStorage } from '../TranslatorsCacheStorage';
import { TranslatorsMap } from '..';

export type Config = Pick<AppConfigType, 'translatorModule' | 'scheduler' | 'cache'>;

/** * Build and manage a translation scheduler */
export class TranslatorManager<Translators extends TranslatorsMap = TranslatorsMap> {
	private config: Config;
	private translators: Translators;
	constructor(config: Config, translators: Translators) {
		this.config = config;
		this.translators = translators;
	}
	public setConfig(config: Config) {
		this.config = config;
		this.getTranslationSchedulerInstance(true);
	}
	public setTranslators(customTranslators: Translators) {
		this.translators = customTranslators;
		this.getTranslationSchedulerInstance(true);
	}
	public getTranslatorFeatures() {
		const translatorClass = this.getTranslatorClass();
		return {
			supportedLanguages: translatorClass
				.getSupportedLanguages()
				.filter((lang) => isLanguageCodeISO639v1(lang)),
			isSupportAutodetect: translatorClass.isSupportedAutoFrom(),
		};
	}
	/** * Return map with available translators */
	public getTranslators(): Translators {
		return this.translators;
	}
	public getTranslator(): InstanceType<RecordValues<Translators>> {
		return this.getTranslatorInstance(false);
	}
	/** * Return configured translation scheduler */
	public getScheduler() {
		return this.getTranslationSchedulerInstance();
	}
	private schedulerInstance: IScheduler | null = null;
	private getTranslationSchedulerInstance(forceCreate = false) {
		if (this.schedulerInstance === null || forceCreate) {
			const translator = this.getTranslatorInstance(true);
			const { useCache, ...schedulerConfig } = this.config.scheduler;
			const scheduler = new Scheduler(translator, schedulerConfig);
			let schedulerInstance: IScheduler = scheduler;
			if (useCache) {
				// Wrap scheduler by cache
				const cacheInstance = this.getCacheInstance();
				schedulerInstance = new SchedulerWithCache(scheduler, cacheInstance);
			}

			this.schedulerInstance = schedulerInstance;
		}

		return this.schedulerInstance;
	}

	private translator: InstanceType<RecordValues<Translators>> | null = null;
	private getTranslatorInstance(forceCreate: boolean) {
		if (!forceCreate && this.translator !== null) return this.translator;
		const translatorClass = this.getTranslatorClass();
		this.translator = new translatorClass() as InstanceType<
			RecordValues<Translators>
		>;
		return this.translator;
	}
	private getCacheInstance() {
		const { translatorModule, cache } = this.config;
		return new TranslatorsCacheStorage(translatorModule, cache);
	}
	private getTranslatorClass(): RecordValues<Translators> {
		const { translatorModule } = this.config;
		const translators = this.getTranslators();
		const translatorClass = translators[translatorModule];
		if (translatorClass === undefined) {
			throw new Error(`Not found translator "${translatorModule}"`);
		}
		return translatorClass as RecordValues<Translators>;
	}
}
