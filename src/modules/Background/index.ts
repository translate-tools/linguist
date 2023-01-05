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

type TranslateSchedulerConfig = Pick<
	AppConfigType,
	'translatorModule' | 'scheduler' | 'cache'
>;

export class TranslatorManager {
	private config: TranslateSchedulerConfig;
	private translators: Record<string, TranslatorClass> = {};
	constructor(
		config: TranslateSchedulerConfig,
		translators: Record<string, TranslatorClass>,
	) {
		this.config = config;
		this.translators = translators;
	}

	public setConfig(config: TranslateSchedulerConfig) {
		this.config = config;
		this.getTranslationSchedulerInstance(true);
	}

	public setTranslators(customTranslators: Record<string, TranslatorClass>) {
		this.translators = customTranslators;
		this.getTranslationSchedulerInstance(true);
	}

	// TODO: return `{customTranslators, translators}`
	/**
	 * Return map `{name: instance}` with available translators
	 */
	public getTranslators = (): Record<string, TranslatorClass> => {
		return this.translators;
	};

	public getTranslatorInfo = () => {
		const translatorClass = this.getTranslatorClass();
		return {
			supportedLanguages: translatorClass.getSupportedLanguages(),
			isSupportAutodetect: translatorClass.isSupportedAutoFrom(),
		};
	};

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

	private translateManager: TranslatorManager | null = null;
	private translateManagerPromise: ProvidePromise<TranslatorManager> | null = null;
	public async getTranslateManager() {
		if (this.translateManager === null) {
			// Create promise to await configuring instance
			if (this.translateManagerPromise === null) {
				this.translateManagerPromise = createPromiseWithControls();
			}

			// TODO: clear promise property
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
				this.translateManager = new TranslatorManager(config, translators);

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
