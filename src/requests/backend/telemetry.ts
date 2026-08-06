import { EventPayload } from '../../lib/telemetry';
import { telemetry } from '../../lib/telemetry/singleton';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [telemetryFactory, telemetryRequest] = buildBackendRequest<{
	eventName: string;
	props?: EventPayload;
}>('telemetry', {
	factoryHandler:
		() =>
		async ({ eventName, props }) => {
			await telemetry.track(eventName, props);
		},
});

export const trackClientEvent = (eventName: string, props?: EventPayload) =>
	telemetryRequest({ eventName, props });
