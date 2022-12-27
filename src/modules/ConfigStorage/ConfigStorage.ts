import browser from 'webextension-polyfill';
import { createEvent, createStore, Store } from 'effector';

import { decodeStruct } from '../../lib/types';
import { AppConfig, AppConfigType } from '../../types/runtime';

interface AbstractStorage<T> {
	get(): Promise<T>;
	set(data: T): Promise<void>;
}

export class ConfigStorage implements AbstractStorage<AppConfigType> {
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

export class ObservableConfigStorage implements AbstractStorage<AppConfigType> {
	private readonly config: AbstractStorage<AppConfigType>;

	constructor(config: AbstractStorage<AppConfigType>) {
		this.config = config;
	}

	private store: Store<AppConfigType> | null = null;
	private readonly updateData = createEvent<AppConfigType>();

	public async getObservableStore() {
		if (this.store === null) {
			const state = await this.config.get();
			this.store = createStore<AppConfigType>(state);
			this.store.on(this.updateData, (_, data) => data);
		}

		return this.store;
	}

	public async get() {
		return this.config.get();
	}

	public async set(data: AppConfigType) {
		const newObject = { ...data };

		await this.config.set(newObject);
		this.updateData(newObject);
	}
}
