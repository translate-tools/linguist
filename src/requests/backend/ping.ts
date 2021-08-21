import { pingSomething } from '../../lib/communication';
import { buildBackendRequest } from '../../lib/requestBuilder';

export const [pingFactory, pingRequest] = buildBackendRequest('ping', {
	factoryHandler: () => () => Promise.resolve('pong' as const),
});

export const ping = (options?: { timeout?: number; delay?: number }) => {
	const { timeout, delay } = options || {};

	return pingSomething(pingRequest, timeout, delay)
		.then(() => true)
		.catch(() => false);
};
