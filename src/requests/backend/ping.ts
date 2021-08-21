import { pingSomething } from '../../lib/communication';
import { buildBackendRequest } from '../../lib/requestBuilder';

export const [pingFactory, pingReq] = buildBackendRequest('ping', {
	factoryHandler: () => async () => 'pong' as const,
});

export const ping = (options?: { timeout?: number; delay?: number }) => {
	const { timeout, delay } = options || {};

	return pingSomething(pingReq, timeout, delay)
		.then(() => true)
		.catch(() => false);
};
