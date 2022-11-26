import * as t from 'io-ts';
import { isEqual, cloneDeep } from 'lodash';
import browser from 'webextension-polyfill';

import { tryDecode, tryDecodeObject } from '../../lib/types';
import { EventManager } from '../../lib/EventManager';
import { AbstractVersionedStorage } from '../../types/utils';
import { AppConfig } from '../../types/runtime';
import { ObservableRecord } from '../../lib/ObservableRecord';

export type CallbackEventName = 'load' | 'update';

export type CallbacksMap<T extends {} = any> = {
	load: () => void;
	update: (newProps: Partial<T>, prevProps: Partial<T>) => void;
};

export type Middleware<T extends {}> = (newProps: Partial<T>, currentProps: T) => boolean;

type ConfigType = t.TypeOfProps<typeof AppConfig.props>;

export class ConfigStorage extends AbstractVersionedStorage {
	static publicName = 'ConfigStorage';
	static storageVersion = 3;

	private static readonly storageName = 'appConfig';
	private static readonly dataSignature = AppConfig.props;

	private state: t.TypeOfProps<typeof ConfigStorage.dataSignature> | null = null;
	private readonly defaultData?: Partial<ConfigType>;

	constructor(defaultData?: Partial<ConfigType>) {
		super();

		// Set `defaultData` which can be partial
		if (defaultData !== undefined) {
			this.defaultData = tryDecodeObject(
				t.partial(ConfigStorage.dataSignature),
				defaultData,
			);
		}

		this.eventDispatcher.subscribe('update', (newProps, prevProps) => {
			this.observable.updateState(
				{ ...(this.state as ConfigType), ...newProps },
				{ ...(this.state as ConfigType), ...prevProps },
			);
		});

		this.init();
	}

	private isLoadConfig = false;

	/**
	 * Init data
	 */
	private async init() {
		// Get data from storage if possible
		const { [ConfigStorage.storageName]: storageDataResponse } =
			await browser.storage.local.get(ConfigStorage.storageName);

		const storageData = storageDataResponse ?? {};

		// Collect data from storage and validate each property by signature
		const dataCollector: Partial<ConfigType> = {};
		for (const keyRaw in ConfigStorage.dataSignature) {
			const key = keyRaw as keyof ConfigType;

			let isDefaultConfig = false;

			// Write to tmp registry a value from storage or default value
			if (key in storageData) {
				dataCollector[key] = storageData[key];
			} else {
				const defaultData = this.defaultData;

				// Make exception when impossible initiate property with current key
				if (defaultData === undefined || !(key in defaultData)) {
					throw new Error(
						`Key "${key}" not found in storage and not defined default value in constructor`,
					);
				}

				dataCollector[key] = defaultData[key] as any;

				// Mark value as default
				isDefaultConfig = true;
			}

			// Validate value and fix if possible
			try {
				// Try decode to validate
				tryDecode((ConfigStorage.dataSignature as any)[key], dataCollector[key]);
			} catch (error) {
				// Throw when it unexpected error type or if it already default data
				if (!(error instanceof TypeError) || isDefaultConfig) throw error;

				// Make exception when default data is not exist for this key
				if (this.defaultData === undefined || !(key in this.defaultData)) {
					throw new Error(
						`Key "${key}" from storage are invalid and not defined default value in constructor`,
					);
				}

				// Try replace to default value
				const defaultValue = this.defaultData[key];
				dataCollector[key as keyof ConfigType] = tryDecode(
					(ConfigStorage.dataSignature as any)[key],
					defaultValue,
				);
			}
		}

		// Validate integrity
		for (const key in ConfigStorage.dataSignature) {
			if (!(key in dataCollector)) {
				throw new Error(
					`Loaded data does not match signature. Property "${key}" is not found`,
				);
			}
		}

		// Write data
		await this.write(dataCollector).then((state) => {
			// Update status
			this.isLoadConfig = true;

			// Call handlers
			this.eventDispatcher
				.getEventHandlers('load')
				.forEach((callback) => callback());

			this.eventDispatcher
				.getEventHandlers('update')
				.forEach((callback) => callback(state, state));
		});
	}

	public isLoad() {
		return this.isLoadConfig;
	}

	/**
	 * Append data to state
	 */
	private async write(newData: Partial<ConfigType>) {
		if (this.state === null) {
			this.state = {} as ConfigType;
		}

		// Write to local state
		for (const key in newData) {
			(this.state as any)[key] = (newData as any)[key];
		}

		// TODO: move to other method `sync`
		// Write to store (sync)
		await browser.storage.local.set({ [ConfigStorage.storageName]: this.state });

		return this.state;
	}

	public async getAllConfig() {
		return this.state;
	}

	public async getConfig<K extends keyof ConfigType, D = null>(
		key: K,
		defaultValue: D,
	): Promise<ConfigType[K] | D>;
	public async getConfig<K extends keyof ConfigType, D = null>(
		key: K,
	): Promise<ConfigType[K] | null>;
	public async getConfig<K extends keyof ConfigType>(
		key: K,
		defaultValue?: any,
	): Promise<any> {
		return this.state !== null && key in this.state
			? this.state[key]
			: defaultValue !== undefined
				? defaultValue
				: null;
	}

	public async set(data: Partial<ConfigType>) {
		if (this.state === null) {
			throw Error('Config state is not init');
		}

		// Collect diffs to variables
		const actualData: typeof data = {};
		const newData: typeof data = {};

		for (const key in data) {
			const actualValue = (this.state as any)[key];
			const newValue = (data as any)[key];

			if (!isEqual(actualValue, newValue)) {
				(actualData as any)[key] = cloneDeep(actualValue);
				(newData as any)[key] = newValue;
			}
		}

		// Validate new values
		for (const key in newData) {
			// Check signature to exist
			if (!(key in ConfigStorage.dataSignature)) {
				throw new RangeError(`Data signature is not have property "${key}"`);
			}

			tryDecode((ConfigStorage.dataSignature as any)[key], (newData as any)[key]);
		}

		// Call middleware
		for (const middleware of this.middlewareHandlers) {
			if (!middleware(newData, this.state)) {
				throw new Error('Update rejected by middleware');
			}
		}

		// Write and send update event to subscribers
		this.write(newData).then(() => {
			this.eventDispatcher
				.getEventHandlers('update')
				.forEach((callback) => callback(newData, actualData));
		});
	}

	public static updateStorageVersion = async (prevVersion: number | null) => {
		switch (prevVersion) {
			case 1: {
				const storageKey = 'config.Main';
				const storageDataRaw = localStorage.getItem(storageKey);

				// Skip
				if (storageDataRaw === null) break;

				// Import valid data
				const storageData = JSON.parse(storageDataRaw);
				if (typeof storageData === 'object') {
					// Collect old data
					const partialData: Partial<ConfigType> = {};
					for (const key in ConfigStorage.dataSignature) {
						if (key in storageData) {
							try {
								const value = storageData[key];
								(partialData as any)[key] = tryDecode(
									(ConfigStorage.dataSignature as any)[key],
									value,
								);
							} catch (err) {
								// Ingore decode errors and throw other
								if (!(err instanceof TypeError)) throw err;
							}
						}
					}

					// Merge actual data with old
					let { [ConfigStorage.storageName]: actualData } =
						await browser.storage.local.get(ConfigStorage.storageName);
					if (typeof actualData !== 'object') {
						actualData = {};
					}

					const mergedData = { ...actualData, ...partialData };

					// Write data
					browser.storage.local.set({
						[ConfigStorage.storageName]: mergedData,
					});
				}

				// Delete old data
				localStorage.removeItem(storageKey);

				break;
			}
			case 2: {
				// Merge actual data with old
				let { [ConfigStorage.storageName]: actualData } =
					await browser.storage.local.get(ConfigStorage.storageName);
				if (typeof actualData !== 'object') {
					actualData = {};
				}

				const contentscriptPropData =
					actualData?.contentscript?.selectTranslator || {};
				const quickTranslate = actualData?.selectTranslator?.quickTranslate;

				const newData = actualData;
				delete newData.contentscript;

				// Write data
				browser.storage.local.set({
					[ConfigStorage.storageName]: {
						...newData,
						selectTranslator: {
							...newData?.selectTranslator,
							...contentscriptPropData,
							mode: quickTranslate
								? 'quickTranslate'
								: newData?.selectTranslator?.mode,
						},
					},
				});

				break;
			}
		}
	};

	private readonly eventDispatcher = new EventManager<CallbacksMap<ConfigType>>();

	/**
	 * Add callback for listen changes
	 */
	public subscribe = this.eventDispatcher.subscribe;

	/**
	 * Delete callback for listen changes
	 */
	public unsubscribe = this.eventDispatcher.unsubscribe;

	// TODO: make middleware a asynchronous
	private readonly middlewareHandlers = new Set<Middleware<ConfigType>>();
	public addMiddleware(middleware: Middleware<ConfigType>) {
		this.middlewareHandlers.add(middleware);
	}

	public removeMiddleware(middleware: Middleware<ConfigType>) {
		this.middlewareHandlers.delete(middleware);
	}

	private observable = new ObservableRecord<ConfigType>();
	public onUpdate = this.observable.onUpdate;
}
