/* eslint-disable camelcase */

import { EventPayload, EventTracker } from '.';

export type RybbitConfig = {
	apiHost: string;
	siteId: string;
	filter?: (eventName: string, props?: EventPayload) => boolean;
};

export class RybbitTracker implements EventTracker {
	constructor(private readonly config: RybbitConfig) {}

	public async sendEvent(eventName: string, props?: EventPayload): Promise<void> {
		const { apiHost, siteId, filter } = this.config;

		if (filter && !filter(eventName, props)) return;

		const response = await fetch(new URL('/api/track', apiHost).toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				site_id: siteId,
				type: 'custom_event',
				event_name: eventName,
				user_id: typeof props?.uid === 'string' ? props.uid : undefined,
				user_agent:
					typeof props?.userAgent === 'string' ? props.userAgent : undefined,
				language:
					typeof props?.language === 'string' ? props.language : undefined,
				properties: JSON.stringify(props),
			}),
		});

		if (!response.ok) {
			throw new Error(response.statusText);
		}
	}
}
