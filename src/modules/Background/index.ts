import { EventManager } from '../../lib/EventManager';

import { ConfigStorage } from '../ConfigStorage/ConfigStorage';
import { TranslatorsCacheStorage } from './TranslatorsCacheStorage';

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

export const isValidNativeTranslatorModuleName = (name: string) =>
	name in translatorModules;

export class Background {
	private readonly registry: Registry = {};
	private readonly config: ConfigStorage;
	constructor(config: ConfigStorage) {
		this.config = config;

		this.init();
	}

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

		// Add handlers
		this.config.addMiddleware((newProps) => {
			if (newProps.translatorModule !== undefined) {
				if (!isValidNativeTranslatorModuleName(newProps.translatorModule)) {
					return false;
				}
			}
			return true;
		});

		this.config.onUpdate(() => {
			// Forced recreate a scheduler
			this.makeScheduler(true);
		}, ['scheduler', 'translatorModule', 'cache']);

		// Emit event
		this.eventDispatcher.getEventHandlers('load').forEach((handler) => handler());
	}

	private readonly eventDispatcher = new EventManager<{
		load: () => void;
	}>();

	public onLoad(handler: () => void) {
		this.eventDispatcher.subscribe('load', handler);
	}

	public get translator() {
		return this.registry.translator;
	}

	public get scheduler() {
		return this.registry.scheduler;
	}

	public getTranslatorInfo = async () => {
		const translatorName = (await this.config.getConfig('translatorModule')) as
			| null
			| keyof typeof translatorModules;
		if (translatorName === null) return null;

		const translatorModule = translatorModules[translatorName];
		return {
			supportedLanguages: translatorModule.getSupportedLanguages(),
			isSupportAutodetect: translatorModule.isSupportedAutoFrom(),
		};
	};

	// TODO: move to requests
	public async clearTranslatorsCache() {
		// Clear for each module
		for (const translatorName in translatorModules) {
			const cache = new TranslatorsCacheStorage(translatorName);
			await cache.clear();
		}
	}

	private makeTranslator = async (force = false) => {
		if (this.registry.translator !== undefined && !force) return;

		const translatorName = (await this.config.getConfig('translatorModule')) as
			| null
			| keyof typeof translatorModules;
		if (translatorName === null || !(translatorName in translatorModules)) {
			throw new Error(
				`Translator builder can't make translator by key "${translatorName}"`,
			);
		}
		this.registry.translator = new translatorModules[translatorName]();
	};

	private makeCache = async (force = false) => {
		if (this.registry.cache !== undefined && !force) return;

		const translatorName = await this.config.getConfig('translatorModule', 'unknown');
		const cacheConfig = await this.config.getConfig('cache', undefined);
		this.registry.cache = new TranslatorsCacheStorage(translatorName, cacheConfig);
	};

	private makeScheduler = async (force = false) => {
		if (this.registry.scheduler !== undefined && !force) return;

		await this.makeTranslator(force);
		const translator = this.registry.translator;

		if (translator === undefined) {
			throw new Error('Translator is not created');
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
