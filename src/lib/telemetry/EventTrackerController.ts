import browser from 'webextension-polyfill';

import { EventPayload, EventTracker } from '.';

export async function getTelemetryId(): Promise<string> {
	let { telemetryId } = await browser.storage.local.get('telemetryId');

	if (!telemetryId) {
		telemetryId = crypto.randomUUID();
		await browser.storage.local.set({ telemetryId });
	}

	return telemetryId;
}

export class EventTrackerController {
	constructor(private readonly tracker: EventTracker) {}

	/**
	 * Method to send event on server and ignore any errors like network connection, etc
	 */
	public track(eventName: string, props?: EventPayload) {
		this.capture(eventName, props).catch((error) => {
			console.warn('Cannot send event to tracker', { eventName, props });
			console.error(error);
		});
	}

	/**
	 * Method to ensure event capturing. It can throw errors
	 */
	public async capture(eventName: string, props?: EventPayload) {
		const uid = await getTelemetryId();
		await this.tracker.sendEvent(eventName, {
			...props,
			uid,
			language: navigator.language,
			userAgent: navigator.userAgent,
		});
	}
}
