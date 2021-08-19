import * as t from 'io-ts';
import { isEqual, cloneDeep } from 'lodash';
import { browser } from 'webextension-polyfill-ts';

import { tryDecode, tryDecodeObject } from '../../lib/types';
import { EventManager } from '../../lib/EventManager';
import { AbstractVersionedStorage } from '../../types/utils';

export type Callback<T extends t.Props> = (
	newProps: Partial<t.TypeOfProps<T>>,
	oldProps: Partial<t.TypeOfProps<T>>,
) => void;

export type CallbackEventName = 'load' | 'update';

export type CallbacksMap<T extends t.Props = any> = {
	load: () => void;
	update: (
		newProps: Partial<t.TypeOfProps<T>>,
		oldProps: Partial<t.TypeOfProps<T>>,
	) => void;
};

export type Middleware<T extends t.Props> = (
	newProps: Partial<t.TypeOfProps<T>>,
	currentProps: t.TypeOfProps<T>,
) => boolean;

// TODO: write migrations for data from `localStorage`
export class ConfigStorage<T extends t.Props = any> extends AbstractVersionedStorage {
	static publicName = 'ConfigStorage';
	static storageVersion = 2;

	private readonly storageName = 'appConfig';
	private readonly dataSignature: T;

	private state: t.TypeOfProps<T> | null = null;
	private readonly defaultData?: Partial<t.TypeOfProps<T>>;

	constructor(dataSignature: T, defaultData?: Partial<t.TypeOfProps<T>>) {
		super();

		this.dataSignature = dataSignature;

		// Set `defaultData` which can be partial
		if (defaultData !== undefined) {
			this.defaultData = tryDecodeObject(
				t.partial(this.dataSignature),
				defaultData,
			);
		}

		this.init();
	}

	private isLoadConfig = false;

	/**
	 * Init data
	 */
	private async init() {
		// Get data from storage if possible
		const { [this.storageName]: storageDataResponse } =
			await browser.storage.local.get(this.storageName);

		const storageData = storageDataResponse ?? {};

		// Collect data from storage and validate each property by signature
		const dataCollector: Partial<t.TypeOfProps<T>> = {};
		for (const key in this.dataSignature) {
			let isDefaultConfig = false;

			// Write to tmp registry a value from storage or default value
			if (key in storageData) {
				dataCollector[key] = storageData[key];
			} else {
				// Make exception when impossible initiate property with current key
				if (this.defaultData === undefined || !(key in this.defaultData)) {
					throw new Error(
						`Key "${key}" not found in storage and not defined default value in constructor`,
					);
				}

				dataCollector[key] = this.defaultData[key];

				// Mark value as default
				isDefaultConfig = true;
			}

			// Validate value and fix if possible
			try {
				// Try decode to validate
				tryDecode(this.dataSignature[key], dataCollector[key]);
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
				dataCollector[key] = tryDecode(this.dataSignature[key], defaultValue);
			}
		}

		// Validate integrity
		for (const key in this.dataSignature) {
			if (!(key in dataCollector)) {
				throw new Error(
					`Loaded data does not match signature. Property "${key}" is not found`,
				);
			}
		}

		// Write data
		await this.write(dataCollector).then(() => {
			// Update status
			this.isLoadConfig = true;

			// Call handlers
			this.eventDispatcher
				.getEventHandlers('load')
				.forEach((callback) => callback());
		});
	}

	public isLoad() {
		return this.isLoadConfig;
	}

	/**
	 * Append data to state
	 */
	private async write(newData: Partial<t.TypeOfProps<T>>) {
		if (this.state === null) {
			this.state = {} as t.TypeOfProps<T>;
		}

		// Write to local state
		for (const key in newData) {
			this.state[key] = newData[key];
		}

		// TODO: move to other method `sync`
		// Write to store (sync)
		await browser.storage.local.set({ [this.storageName]: this.state });
	}

	public async getAllConfig() {
		return this.state;
	}

	public async getConfig<K extends keyof t.TypeOfProps<T>, D = null>(
		key: K,
		defaultValue: D,
	): Promise<t.TypeOfProps<T>[K] | D>;
	public async getConfig<K extends keyof t.TypeOfProps<T>, D = null>(
		key: K,
	): Promise<t.TypeOfProps<T>[K] | null>;
	public async getConfig<K extends keyof t.TypeOfProps<T>, D = null>(
		key: K,
		defaultValue?: D,
	): Promise<t.TypeOfProps<T>[K] | D> {
		return this.state !== null && key in this.state
			? this.state[key]
			: defaultValue !== undefined
				? defaultValue
				: null;
	}

	public async set(data: Partial<t.TypeOfProps<T>>) {
		if (this.state === null) {
			throw Error('Config state is not init');
		}

		// Collect diffs to variables
		const actualData: typeof data = {};
		const newData: typeof data = {};

		for (const key in data) {
			const actualValue = this.state[key];
			const newValue = data[key];

			if (!isEqual(actualValue, newValue)) {
				actualData[key] = cloneDeep(actualValue);
				newData[key] = newValue;
			}
		}

		// Validate new values
		for (const key in newData) {
			// Check signature to exist
			if (!(key in this.dataSignature)) {
				throw new RangeError(`Data signature is not have property "${key}"`);
			}

			tryDecode(this.dataSignature[key], newData[key]);
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

	private readonly eventDispatcher = new EventManager<CallbacksMap<T>>();

	/**
	 * Add callback for listen changes
	 */
	public subscribe = this.eventDispatcher.subscribe;

	/**
	 * Delete callback for listen changes
	 */
	public unsubscribe = this.eventDispatcher.unsubscribe;

	// TODO: make middleware are async
	private readonly middlewareHandlers = new Set<Middleware<T>>();
	public addMiddleware(middleware: Middleware<T>) {
		this.middlewareHandlers.add(middleware);
	}

	public removeMiddleware(middleware: Middleware<T>) {
		this.middlewareHandlers.delete(middleware);
	}
}
