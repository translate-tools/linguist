export type EventPayload = Record<string, any>;
export interface EventTracker {
	sendEvent(eventName: string, props?: EventPayload): Promise<void>;
}

export enum TELEMETRY_EVENT_NAME {
	APP_OPENED = 'App opened',
	APP_INSTALLED = 'App installed',
	APP_UPDATED = 'App updated',

	PAGE_TRANSLATION = 'Page translation',
	TEXT_TRANSLATION = 'Text translation',
	SELECTED_TEXT_TRANSLATION = 'Selected text translation',

	POPUP_OPENED = 'Popup opened',
	VISIT_PREFERENCES_SCREEN = 'Visit preferences screen',
	CONFIG_UPDATED = 'Config updated',

	CAPTURED_ERROR = 'Captured error',
}
