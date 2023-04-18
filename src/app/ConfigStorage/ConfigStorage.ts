import { createEvent, createStore, Store } from 'effector';
import browser from 'webextension-polyfill';

import { updateNotEqualProps } from '../../lib/effector/reducers';
import { decodeStruct } from '../../lib/types';
import { AppConfig, AppConfigType } from '../../types/runtime';

export interface AsyncStorage<T> {
	get(): Promise<T>;
	set(data: T): Promise<void>;
}

export class ConfigStorage implements AsyncStorage<AppConfigType> {
	private readonly storageName = 'appConfig';
	private readonly defaultData: AppConfigType;

	constructor(defaultData: AppConfigType) {
		this.defaultData = defaultData;
	}

	public async get() {
		// Get data from storage if possible
		const { [this.storageName]: data } = await browser.storage.local.get(
			this.storageName,
		);

		// Return default data for empty storage
		if (data === undefined) {
			return this.defaultData;
		}

		const configCodec = decodeStruct(AppConfig, data);
		if (configCodec.errors !== null) {
			throw new Error('Invalid config');
		}

		return configCodec.data;
	}

	public async set(data: AppConfigType) {
		await browser.storage.local.set({ [this.storageName]: data });
	}
}

export class ObservableAsyncStorage<T extends Record<any, any>>
implements AsyncStorage<T>
{
	private readonly config: AsyncStorage<T>;

	constructor(config: AsyncStorage<T>) {
		this.config = config;
	}

	private store: Store<T> | null = null;
	private readonly updateData = createEvent<T>();

	public async getObservableStore() {
		if (this.store === null) {
			const state = await this.config.get();
			this.store = createStore<T>(state);
			this.store.on(this.updateData, updateNotEqualProps);
		}

		return this.store;
	}

	public async get() {
		return this.config.get();
	}

	public async set(data: T) {
		const newObject = { ...data };

		await this.config.set(newObject);
		this.updateData(newObject);
	}
}
