import { EventTrackerController } from './EventTrackerController';
import { RybbitTracker } from './RybbitTracker';

export const telemetry = new EventTrackerController(
	new RybbitTracker({
		apiHost: 'https://events.vitonsky.net',
		siteId: '881301ac5ca2',
	}),
);
