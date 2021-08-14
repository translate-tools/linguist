import * as t from 'io-ts';
import { isEqual, cloneDeep } from 'lodash';

import { tryDecode, tryDecodeObject } from '../../lib/types';
import { AbstractVersionedStorage } from '../../types/utils';

export type Callback<T extends t.Props> = (
	newProps: Partial<t.TypeOfProps<T>>,
	oldProps: Partial<t.TypeOfProps<T>>,
) => void;

export type Middleware<T extends t.Props> = (
	newProps: Partial<t.TypeOfProps<T>>,
	currentProps: t.TypeOfProps<T>,
) => boolean;

// TODO: move to async storage
export class ConfigStorage<T extends t.Props> extends AbstractVersionedStorage {
	static publicName = 'ConfigStorage';
	static storageVersion = 1;

	private readonly storageName = 'config.Main';
	private readonly types: T;

	private readonly callbacks = new Set<Callback<T>>();
	private state: t.TypeOfProps<T> | null = null;
	private readonly defaultData?: Partial<t.TypeOfProps<T>>;

	constructor(types: T, defaultData?: Partial<t.TypeOfProps<T>>) {
		super();

		this.types = types;

		if (defaultData !== undefined) {
			this.defaultData = tryDecodeObject(t.partial(this.types), defaultData);
		}

		this.init();
	}

	/**
	 * Init data
	 */
	private init() {
		// Get data from storage if possible
		const rawStorageData = localStorage.getItem(this.storageName);
		const configData = rawStorageData === null ? {} : JSON.parse(rawStorageData);
		if (typeof configData !== 'object') {
			throw new Error('Invalid data from storage');
		}

		// Validate and write necessary config properties
		const dataCollector: Record<string, any> = {};
		for (const key in this.types) {
			let isDefaultConfig = false;

			// Write to tmp registry a value from storage or default value
			if (key in configData) {
				dataCollector[key] = configData[key];
			} else {
				if (this.defaultData === undefined || !(key in this.defaultData)) {
					throw new Error(
						`Key "${key}" not found in storage and not defined default value in constructor`,
					);
				}

				isDefaultConfig = true;
				dataCollector[key] = this.defaultData[key];
			}

			// Validate value and fix if possible
			try {
				// Try decode to validate
				tryDecode(this.types[key], dataCollector[key]);
			} catch (error) {
				if (!(error instanceof TypeError) || isDefaultConfig) throw error;

				if (this.defaultData === undefined || !(key in this.defaultData)) {
					throw new Error(
						`Key "${key}" from storage are invalid and not defined default value in constructor`,
					);
				}

				const defaultValue = this.defaultData[key];

				// Try merge default and current value if it object
				let isMerged = false;
				const currentValue = dataCollector[key];
				if (
					typeof defaultValue === 'object' &&
					typeof currentValue === 'object'
				) {
					const mergedValue = { ...defaultValue, ...currentValue };

					try {
						dataCollector[key] = tryDecode(this.types[key], mergedValue);
						isMerged = true;
					} catch {}
				}

				// Try replace to default value
				if (!isMerged) {
					// Try decode to validate default value
					dataCollector[key] = tryDecode(this.types[key], defaultValue);
				}
			}
		}

		// Additional validation. It may be removed, cuz data already validated
		const configSignature = t.type(this.types);
		const data = tryDecodeObject(configSignature, dataCollector);

		this.write(data);
	}

	/**
	 * Append data to state
	 */
	private write(newData: Partial<t.TypeOfProps<T>>) {
		if (this.state === null) {
			this.state = {} as t.TypeOfProps<T>;
		}

		// Write to local state
		for (const key in newData) {
			this.state[key] = newData[key];
		}

		// Write to store (sync)
		const encodedData = JSON.stringify(this.state);
		localStorage.setItem(this.storageName, encodedData);
	}

	public subscribe(callback: Callback<T>) {
		this.callbacks.add(callback);
	}

	public unsubscribe(callback: Callback<T>) {
		this.callbacks.delete(callback);
	}

	public getAllConfig() {
		return this.state;
	}

	public getConfig<K extends keyof t.TypeOfProps<T>, D = null>(
		key: K,
		defaultValue?: D,
	): t.TypeOfProps<T>[K] | D {
		return this.state !== null && key in this.state
			? this.state[key]
			: defaultValue !== undefined
				? defaultValue
				: null;
	}

	public set(data: Partial<t.TypeOfProps<T>>) {
		if (this.state === null) {
			throw Error('Config state is not init');
		}

		// Collect changes to variables
		const newData: typeof data = {};
		const oldData: typeof data = {};

		for (const key in data) {
			const newValue = data[key];
			const currentValue = this.state[key];

			if (!isEqual(currentValue, newValue)) {
				newData[key] = newValue;
				oldData[key] = cloneDeep(currentValue);
			}
		}

		// Validate new values
		for (const key in newData) {
			try {
				tryDecode(this.types[key], newData[key]);
			} catch (error) {
				// Prevent exception and just prevent changes
				return false;
			}
		}

		// Call middleware
		for (const middleware of this.middlewareHandlers) {
			if (!middleware(newData, this.state)) {
				// Prevent changes
				return false;
			}
		}

		// Write and send to all subscribers
		this.write(newData);
		this.callbacks.forEach((callback) => callback(newData, oldData));

		return true;
	}

	private readonly middlewareHandlers = new Set<Middleware<T>>();
	public addMiddleware(middleware: Middleware<T>) {
		this.middlewareHandlers.add(middleware);
	}

	public removeMiddleware(middleware: Middleware<T>) {
		this.middlewareHandlers.delete(middleware);
	}
}
