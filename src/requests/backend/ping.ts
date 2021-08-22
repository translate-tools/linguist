import { makePing } from '../utils/makePing';
import { buildBackendRequest } from '../utils/requestBuilder';

export const [pingFactory, pingReq] = buildBackendRequest('ping', {
	factoryHandler: () => async () => 'pong' as const,
});

export const ping = (options?: { timeout?: number; delay?: number }) => {
	const { timeout, delay } = options || {};

	return makePing(pingReq, timeout, delay)
		.then(() => true)
		.catch(() => false);
};
