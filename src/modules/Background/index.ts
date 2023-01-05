import { combine } from 'effector';
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
import { getCustomTranslatorsClasses } from '../../requests/backend/translators/applyTranslators';

export const translatorModules = {
	YandexTranslator,
	GoogleTranslator,
	BingTranslatorPublic,
} as const;

export const DEFAULT_TRANSLATOR = 'GoogleTranslator';

export const getTranslatorNameById = (id: number | string) => '#' + id;

export const mergeCustomTranslatorsWithBasicTranslators = (
	customTranslators: Record<string, TranslatorClass>,
) => {
	const translatorsClasses: Record<string, TranslatorClass> = { ...translatorModules };
	for (const key in customTranslators) {
		const translatorId = getTranslatorNameById(key);
		const translatorClass = customTranslators[key];

		translatorsClasses[translatorId] = translatorClass;
	}

	return translatorsClasses;
};

interface Registry {
	translator?: BaseTranslator;
	cache?: TranslatorsCacheStorage;
	scheduler?: IScheduler;
}

type TranslateSchedulerConfig = Pick<
	AppConfigType,
	'translatorModule' | 'scheduler' | 'cache'
>;

// TODO: refactor registry use
export class TranslateScheduler {
	private readonly registry: Registry = {};

	private config: TranslateSchedulerConfig;
	private translators: Record<string, TranslatorClass> = {};
	constructor(
		config: TranslateSchedulerConfig,
		translators: Record<string, TranslatorClass>,
	) {
		this.config = config;
		this.translators = translators;
	}

	public async setConfig(config: TranslateSchedulerConfig) {
		this.config = config;
		await this.makeScheduler(true);
	}

	public async setTranslators(customTranslators: Record<string, TranslatorClass>) {
		this.translators = customTranslators;
		await this.makeScheduler(true);
	}

	// TODO: return `{customTranslators, translators}`
	/**
	 * Return map `{name: instance}` with available translators
	 */
	public getTranslators = (): Record<string, TranslatorClass> => {
		return this.translators;
	};

	public getTranslatorInfo = async () => {
		const translatorClass = await this.getTranslatorClass();
		return translatorClass === null
			? null
			: {
				supportedLanguages: translatorClass.getSupportedLanguages(),
				isSupportAutodetect: translatorClass.isSupportedAutoFrom(),
			  };
	};

	// TODO: split class here. Move logic below to class `TranslatorManager`,
	// and create instance outside of this class
	private schedulerAwaiter: Promise<IScheduler> | null = null;
	public async getScheduler() {
		if (this.registry.scheduler !== undefined) return this.registry.scheduler;

		if (this.schedulerAwaiter !== null) return this.schedulerAwaiter;

		this.schedulerAwaiter = this.makeScheduler().then(() => {
			this.schedulerAwaiter = null;

			if (this.registry.scheduler === undefined) {
				throw new Error("Can't make scheduler");
			}

			return this.registry.scheduler;
		});

		return this.schedulerAwaiter;
	}

	private getTranslatorClass = async (): Promise<TranslatorClass<BaseTranslator>> => {
		const { translatorModule } = await this.config;

		const translators = this.getTranslators();
		let translatorClass = translators[translatorModule];
		if (translatorClass === undefined) {
			console.warn('Not found translator by name', translatorModule);
			translatorClass = translators[DEFAULT_TRANSLATOR];
			if (translatorClass === undefined) {
				throw new Error(
					"Can't found default translator in provided translators list",
				);
			}
		}

		return translatorClass as TranslatorClass<BaseTranslator>;
	};

	private makeTranslator = async (force = false) => {
		if (this.registry.translator !== undefined && !force) return;

		const translatorClass = await this.getTranslatorClass();
		this.registry.translator = new translatorClass();
	};

	private makeCache = async (force = false) => {
		if (this.registry.cache !== undefined && !force) return;

		const { translatorModule, cache } = await this.config;
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

		const { scheduler } = await this.config;
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

// TODO: move to another file
type ProvidePromise<T = void> = {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
};

const createPromiseWithControls = <T = void>() => {
	const result = {} as ProvidePromise<T>;

	result.promise = new Promise<T>((resolve, reject) => {
		result.resolve = resolve;
		result.reject = reject;
	});

	return result;
};

/**
 * Resources manager class
 */
export class Background {
	private readonly config: ObservableAsyncStorage<AppConfigType>;
	constructor(config: ObservableAsyncStorage<AppConfigType>) {
		this.config = config;
	}

	private translateManager: TranslateScheduler | null = null;
	private translateManagerPromise: ProvidePromise<TranslateScheduler> | null = null;
	public async getTranslateManager() {
		if (this.translateManager === null) {
			// Create promise to await configuring instance
			if (this.translateManagerPromise === null) {
				this.translateManagerPromise = createPromiseWithControls();
			}

			return this.translateManagerPromise.promise;
		}

		return this.translateManager;
	}

	public async start() {
		const $config = await this.config.getObservableStore();

		// Send update event
		$config.watch(() => {
			sendConfigUpdateEvent();
		});

		// Update translate scheduler
		const schedulerStores = reshape({
			source: $config,
			shape: {
				scheduler: ({ scheduler }) => scheduler,
				translatorModule: ({ translatorModule }) => translatorModule,
				cache: ({ cache }) => cache,
			},
		});

		const $translateManagerConfig = combine(
			[
				schedulerStores.translatorModule,
				schedulerStores.scheduler,
				schedulerStores.cache,
			],
			([translatorModule, scheduler, cache]) => ({
				translatorModule,
				scheduler,
				cache,
			}),
		);

		// Build translators list
		const translators = await getCustomTranslatorsClasses().then(
			(customTranslators) => {
				return mergeCustomTranslatorsWithBasicTranslators(customTranslators);
			},
		);

		$translateManagerConfig.watch((config) => {
			if (this.translateManager === null) {
				this.translateManager = new TranslateScheduler(config, translators);

				// Return a scheduler instance for awaiters
				if (this.translateManagerPromise !== null) {
					this.translateManagerPromise.resolve(this.translateManager);
				}
				return;
			}

			this.translateManager.setConfig(config);
		});

		// Prevent run it again on other pages, such as options page
		if (isBackgroundContext()) {
			requestHandlers.forEach((factory) => {
				factory({
					config: this.config,
					bg: this,
					// TODO: review usages, maybe add custom translators
					translatorModules: translatorModules as any,
				});
			});
		}
	}
}
