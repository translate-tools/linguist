import { TranslatorClass } from '../types/objects';
import { AppConfig } from '../types/runtime';

import { EventManager } from '../lib/EventManager';

import { ConfigStorage } from './ConfigStorage/ConfigStorage';

import { ITranslateScheduler } from '@translate-tools/core/TranslateScheduler/ITranslateScheduler';
import { TranslateScheduler } from '@translate-tools/core/TranslateScheduler/TranslateScheduler';
import {
	TranslatorCache,
	TranslateSchedulerWithCache,
} from '@translate-tools/core/TranslateScheduler/TranslateSchedulerWithCache';

import { Translator } from '@translate-tools/core/types/Translator';
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import { YandexTranslator } from '@translate-tools/core/translators/YandexTranslator';
import { BingTranslatorPublic } from '@translate-tools/core/translators/unstable/BingTranslatorPublic';

interface Registry {
	translator?: Translator;
	cache?: TranslatorCache;
	scheduler?: ITranslateScheduler;
}

export const translatorModules: Record<string, TranslatorClass> = {
	YandexTranslator,
	GoogleTranslator,
	BingTranslatorPublic,
};

export const isValidNativeTranslatorModuleName = (name: string) =>
	name in translatorModules;

export class Background<T extends typeof AppConfig.props> {
	private readonly registry: Registry = {};
	private readonly config: ConfigStorage<T>;
	constructor(config: ConfigStorage<T>) {
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

		this.config.subscribe(
			'update',
			({ scheduler, translatorModule, cache }, prevConfig) => {
				// Forced recreate a scheduler while change of key options
				if (
					scheduler !== undefined ||
					translatorModule !== undefined ||
					(cache !== undefined && prevConfig.scheduler?.useCache)
				) {
					this.makeScheduler(true);
				}
			},
		);

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

	// TODO: move to requests
	public async clearTranslatorsCache() {
		// Clear for each module
		for (const translatorName in translatorModules) {
			const cache = new TranslatorCache(translatorName);
			await cache.clear();
		}
	}

	private makeTranslator = async (force = false) => {
		if (this.registry.translator !== undefined && !force) return;

		const translatorName = await this.config.getConfig('translatorModule');
		if (translatorName === null || !(translatorName in translatorModules)) {
			throw new Error(
				`Translator builder can't make translator by key "${translatorName}"`,
			);
		}

		this.registry.translator = new (translatorModules as any)[translatorName]();
	};

	private makeCache = async (force = false) => {
		if (this.registry.cache !== undefined && !force) return;

		const translatorName = await this.config.getConfig('translatorModule', 'unknown');
		const cacheConfig = await this.config.getConfig('cache', undefined);
		this.registry.cache = new TranslatorCache(translatorName, cacheConfig);
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
		const baseScheduler = new TranslateScheduler(translator, config);
		if (!useCache) {
			this.registry.scheduler = baseScheduler;
		} else {
			await this.makeCache(force);
			this.registry.scheduler = new TranslateSchedulerWithCache(
				baseScheduler,
				this.registry.cache,
			);
		}
	};
}
