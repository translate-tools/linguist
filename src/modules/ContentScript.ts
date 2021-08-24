import { AppConfigType } from '../types/runtime';

import { EventManager } from '../lib/EventManager';
import { getAllTabs } from '../lib/browser/tabs';

import { addRequestHandler, sendTabRequest } from '../requests/utils';
import { getConfig } from '../requests/backend/getConfig';
import { ping } from '../requests/backend/ping';

// TODO: use builder for this request to ensure types integrity
// Firstly, we should refactor builder to make it more abstract

// Send update event
export const sendConfigUpdateEvent = () =>
	getAllTabs().then((tabs) =>
		tabs.forEach((tab) =>
			sendTabRequest(tab.id, 'configUpdated')
				// Ignore errors
				.catch(() => {}),
		),
	);

export class ContentScript {
	private eventManger = new EventManager<{
		load: (config: AppConfigType) => void;
		configUpdate: (config: AppConfigType) => void;
	}>();
	private config?: AppConfigType;

	constructor() {
		this.init();
	}

	private async init() {
		// Wait load background script
		await ping({ delay: 100 });

		this.config = await getConfig();
		if (this.config !== undefined) {
			this.eventManger.emit('load', [this.config]);
		} else {
			throw new Error("Can't load config");
		}

		// Observe a config updating
		addRequestHandler('configUpdated', () => {
			getConfig().then((config) => {
				this.config = config;
				this.eventManger.emit('configUpdate', [this.config]);
			});
		});
	}

	public getConfig() {
		return this.config;
	}

	public onLoad(callback: (config: AppConfigType) => void) {
		this.eventManger.subscribe('load', callback);
	}

	public onUpdate(callback: (config: AppConfigType) => void) {
		this.eventManger.subscribe('configUpdate', callback);
	}
}
