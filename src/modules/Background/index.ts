import { merge } from 'effector';
import { reshape } from 'patronum';

// Schedulers
import {
	IScheduler,
	Scheduler,
	SchedulerWithCache,
} from '@translate-tools/core/util/Scheduler';

// Translators
import { BaseTranslator } from '@translate-tools/core/types/Translator';
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import { YandexTranslator } from '@translate-tools/core/translators/YandexTranslator';
import { BingTranslatorPublic } from '@translate-tools/core/translators/unstable/BingTranslatorPublic';
import { TranslatorClass } from '@translate-tools/core/types/Translator';

import { AppConfigType } from '../../types/runtime';
import { ObservableAsyncStorage } from '../ConfigStorage/ConfigStorage';
import { TranslatorsCacheStorage } from './TranslatorsCacheStorage';
import { isBackgroundContext } from '../../lib/browser';
import { requestHandlers } from '../App/messages';
import { sendConfigUpdateEvent } from '../ContentScript';

interface Registry {
	translator?: BaseTranslator;
	cache?: TranslatorsCacheStorage;
	scheduler?: IScheduler;
}

export const translatorModules = {
	YandexTranslator,
	GoogleTranslator,
	BingTranslatorPublic,
} as const;

export const DEFAULT_TRANSLATOR = 'GoogleTranslator';

export const getTranslatorNameById = (id: number | string) => '#' + id;

/**
 * Resources manager class
 */
export class Background {
	private readonly registry: Registry = {};

	private readonly config: ObservableAsyncStorage<AppConfigType>;
	constructor(config: ObservableAsyncStorage<AppConfigType>) {
		this.config = config;
	}

	private customTranslators: Record<string, TranslatorClass> = {};
	public updateCustomTranslatorsList = (
		translators: Record<string, TranslatorClass>,
	) => {
		this.customTranslators = translators;
		this.makeScheduler(true);
	};

	public getTranslators = (): Record<string, TranslatorClass> => {
		// Build custom translators list
		const translators: Record<string, TranslatorClass> = {};
		for (const key in this.customTranslators) {
			translators[getTranslatorNameById(key)] = this.customTranslators[key];
		}

		return { ...translators, ...translatorModules };
	};

	// TODO: think about move it outside
	public async start() {
		const $config = await this.config.getObservableStore();

		// Init state
		await this.makeTranslator();
		await this.makeScheduler();

		const schedulerStores = reshape({
			source: $config,
			shape: {
				scheduler: ({ scheduler }) => scheduler,
				translatorModule: ({ translatorModule }) => translatorModule,
				cache: ({ cache }) => cache,
			},
		});

		merge(Object.values(schedulerStores)).watch(() => {
			// Forced recreate a scheduler
			this.makeScheduler(true);
		});

		// Send update event
		$config.watch(() => {
			sendConfigUpdateEvent();
		});

		// Prevent run it again on other pages, such as options page
		if (isBackgroundContext()) {
			requestHandlers.forEach((factory) => {
				factory({
					config: this.config,
					bg: this,
					translatorModules: translatorModules as any,
				});
			});
		}
	}

	// TODO: split class here. Move logic below to class `TranslatorManager`,
	// and create instance outside of this class
	public get translator() {
		return this.registry.translator;
	}

	public get scheduler() {
		return this.registry.scheduler;
	}

	private getTranslator = async (): Promise<TranslatorClass<BaseTranslator> | null> => {
		const { translatorModule } = await this.config.get();

		if (translatorModule === null) return null;

		const translators = this.getTranslators();
		const translatorClass = translators[translatorModule];

		return (translatorClass as TranslatorClass<BaseTranslator>) ?? null;
	};

	public getTranslatorInfo = async () => {
		const translatorModule = await this.getTranslator();
		return translatorModule === null
			? null
			: {
				supportedLanguages: translatorModule.getSupportedLanguages(),
				isSupportAutodetect: translatorModule.isSupportedAutoFrom(),
			  };
	};

	private makeTranslator = async (force = false) => {
		if (this.registry.translator !== undefined && !force) return;

		const translatorModule = await this.getTranslator();
		if (translatorModule === null) {
			// throw new Error(
			// 	`Not found translator`,
			// );
			return;
		}

		this.registry.translator = new translatorModule();
	};

	private makeCache = async (force = false) => {
		if (this.registry.cache !== undefined && !force) return;

		const { translatorModule, cache } = await this.config.get();
		this.registry.cache = new TranslatorsCacheStorage(translatorModule, cache);
	};

	private makeScheduler = async (force = false) => {
		if (this.registry.scheduler !== undefined && !force) return;

		// TODO: check context loss after awaiting
		await this.makeTranslator(force);
		const translator = this.registry.translator;

		if (translator === undefined) {
			// throw new Error('Translator is not created');
			return;
		}

		const { scheduler } = await this.config.get();
		if (scheduler === null) {
			throw new Error("Can't get scheduler config");
		}

		const { useCache, ...schedulerConfig } = scheduler;
		const baseScheduler = new Scheduler(translator, schedulerConfig);

		// Try use cache if possible
		if (useCache) {
			await this.makeCache(force);
			const cache = this.registry.cache;
			if (cache !== undefined) {
				this.registry.scheduler = new SchedulerWithCache(baseScheduler, cache);
				return;
			}
		}

		// Use scheduler without cache
		this.registry.scheduler = baseScheduler;
	};
}
