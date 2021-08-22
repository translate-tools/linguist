import { makePing } from '../../lib/requests/makePing';
import { buildBackendRequest } from '../../lib/requests/requestBuilder';

export const [pingFactory, pingReq] = buildBackendRequest('ping', {
	factoryHandler: () => async () => 'pong' as const,
});

export const ping = (options?: { timeout?: number; delay?: number }) => {
	const { timeout, delay } = options || {};

	return makePing(pingReq, timeout, delay)
		.then(() => true)
		.catch(() => false);
};
