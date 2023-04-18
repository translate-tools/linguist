import { getAllTabs } from '../../lib/browser/tabs';
import { AppConfigType } from '../../types/runtime';

import { addRequestHandler, sendBackgroundRequest, sendTabRequest } from '../utils';

export const appConfigUpdateEventName = 'global.appConfigUpdate';

/**
 * Send update event everywhere for background and content scripts
 */
export const sendAppConfigUpdateEvent = (config: AppConfigType) => {
	sendBackgroundRequest(appConfigUpdateEventName, config)
		// Ignore errors
		.catch(() => {});

	getAllTabs().then((tabs) =>
		tabs.forEach((tab) =>
			sendTabRequest(tab.id, appConfigUpdateEventName, config)
				// Ignore errors
				.catch(() => {}),
		),
	);
};

/**
 * Add handler for app config update
 */
export const onAppConfigUpdated = (handler: (config: AppConfigType) => void) =>
	addRequestHandler(appConfigUpdateEventName, handler);
