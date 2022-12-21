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

import { EventManager } from '../../lib/EventManager';

import { ConfigStorage } from '../ConfigStorage/ConfigStorage';
import { TranslatorsCacheStorage } from './TranslatorsCacheStorage';

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

	private readonly config: ConfigStorage;
	constructor(config: ConfigStorage) {
		this.config = config;

		// TODO: move initializing to direct call outside
		this.init();
	}

	private customTranslators: Record<string, TranslatorClass> = {};
	public updateCustomTranslatorsList = (
		translators: Record<string, TranslatorClass>,
	) => {
		console.warn('UPDATE translators', translators);

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

	private async init() {
		// Await config loading
		if (!this.config.isLoad()) {
			await new Promise<void>((res) => {
				this.config.subscribe('load', res);
			});
		}

		// Init state
		await this.makeTranslator();
		await this.makeScheduler();

		const schedulerStores = reshape({
			source: this.config.$config.map((payload) => {
				if (payload === null) {
					throw new Error('Unexpected empty config');
				}

				return payload;
			}),
			shape: {
				scheduler: ({ scheduler }) => scheduler,
				translatorModule: ({ translatorModule }) => translatorModule,
				cache: ({ cache }) => cache,
			},
		});

		merge(Object.values(schedulerStores)).watch(() => {
			console.log('>> makeScheduler call');
			// Forced recreate a scheduler
			this.makeScheduler(true);
		});

		// Emit event
		this.eventDispatcher.getEventHandlers('load').forEach((handler) => handler());
	}

	private readonly eventDispatcher = new EventManager<{
		load: () => void;
	}>();

	public onLoad(handler: () => void) {
		this.eventDispatcher.subscribe('load', handler);
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
		const translatorName = await this.config.getConfig('translatorModule');

		if (translatorName === null) return null;

		const translators = this.getTranslators();
		const translatorClass = translators[translatorName];

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

		const translatorName = await this.config.getConfig('translatorModule', 'unknown');
		const cacheConfig = await this.config.getConfig('cache', undefined);
		this.registry.cache = new TranslatorsCacheStorage(translatorName, cacheConfig);
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

		const schedulerConfig = await this.config.getConfig('scheduler');
		if (schedulerConfig === null) {
			throw new Error("Can't get scheduler config");
		}

		const { useCache, ...config } = schedulerConfig;
		const baseScheduler = new Scheduler(translator, config);

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
