import { createEvent, createStore, Store } from 'effector';

import { updateNotEqualProps } from '../../lib/effector/reducers';
import { getConfig } from '../../requests/backend/getConfig';
import { ping } from '../../requests/backend/ping';
import { onAppConfigUpdated } from '../../requests/global/appConfigUpdate';
import { AppConfigType } from '../../types/runtime';

export class ClientConfig {
	private store: Store<AppConfigType> | null = null;
	private readonly updateData = createEvent<AppConfigType>();

	private cleanupCallbacks: (() => void)[] = [];
	public async getStore() {
		if (this.store === null) {
			// TODO: add deadline
			// Wait load background script
			await ping({ delay: 100 });

			const state = await getConfig();
			this.store = createStore(state);
			this.store.on(this.updateData, updateNotEqualProps);

			const unsubscribeRequestHandler = onAppConfigUpdated((config) => {
				this.updateData(config);
			});

			this.cleanupCallbacks.push(unsubscribeRequestHandler);
		}

		return this.store;
	}

	public disconnect() {
		if (this.store === null) return;

		this.cleanupCallbacks.forEach((cleanup) => cleanup());
		this.store = null;
	}
}
