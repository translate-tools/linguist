import { getCurrentTabId, pingSomething } from '../../lib/communication';
import { buildTabRequest } from '../../lib/requestBuilder';

export const [pingFactory, pingReq] = buildTabRequest('ping', {
	factoryHandler: () => async () => 'pong' as const,
});

export const ping = async (options?: {
	timeout?: number;
	tabId?: number;
	delay?: number;
}) => {
	const { timeout, tabId, delay } = options || {};

	const actualTabId = tabId ?? (await getCurrentTabId());

	return pingSomething(() => pingReq(actualTabId), timeout, delay)
		.then(() => true)
		.catch(() => false);
};
