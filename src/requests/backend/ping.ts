import { makePing } from '../utils/makePing';
import { buildBackendRequest } from '../utils/requestBuilder';

export const [pingFactory, pingReq] = buildBackendRequest('ping', {
	factoryHandler: () => async () => {
		console.log('Send PONG');
		return 'pong' as const;
	},
});

export const ping = (options?: { timeout?: number; delay?: number }) => {
	const { timeout, delay } = options || {};

	return makePing(pingReq, timeout, delay)
		.then(() => true)
		.catch((err) => {
			console.error('PING ERR', err);
			return false;
		});
};
