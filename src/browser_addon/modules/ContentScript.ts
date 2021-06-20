import { addRequestHandler } from '../lib/communication';
import { EventManager } from '../lib/EventManager';
import { getConfig } from '../requests/backend/getConfig';
import { AppConfigType } from '../types/runtime';

export class ContentScript {
	private eventManger: EventManager<AppConfigType>;
	private config?: AppConfigType;

	constructor() {
		this.eventManger = new EventManager<AppConfigType>();

		// Load config and initiate
		getConfig().then((config) => {
			this.config = config;
			this.init();
		});
	}

	private init() {
		if (this.config !== undefined) {
			this.eventManger.emit('loaded', this.config);
		}

		// Observe a config updating
		addRequestHandler('configUpdated', () => {
			getConfig().then((config) => {
				this.config = config;
				this.eventManger.emit('configUpdate', this.config);
			});
		});
	}

	public getConfig() {
		return this.config;
	}

	public onLoad(callback: (config: AppConfigType) => void) {
		this.eventManger.subscribe('loaded', callback);
	}

	public onUpdate(callback: (config: AppConfigType) => void) {
		this.eventManger.subscribe('configUpdate', callback);
	}
}
