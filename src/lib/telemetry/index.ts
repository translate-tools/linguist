export type EventPayload = Record<string, any>;
export interface EventTracker {
	sendEvent(eventName: string, props?: EventPayload): Promise<void>;
}

export enum TELEMETRY_EVENT_NAME {
	APP_OPENED = 'App opened',
	APP_INSTALLED = 'App installed',
	APP_UPDATED = 'App updated',

	PAGE_TRANSLATION_CHANGED = 'Page translation changed',
	TEXT_TRANSLATION_COMPLETED = 'Text translation completed',
	TRANSLATION_MOVED_IN_DICTIONARY = 'Translation moved in dictionary',

	POPUP_OPENED = 'Popup opened',
	SELECTED_TEXT_POPUP_SHOWN = 'Selected text popup shown',
	SCREEN_SHOWN = 'Screen shown',
	SETTINGS_UPDATED = 'Settings updated',

	TTS_STARTED = 'TTS playback started',
	TTS_STOPPED = 'TTS playback stopped',

	ERROR_CAPTURED = 'Error captured',
}
