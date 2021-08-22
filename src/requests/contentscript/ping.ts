import { getCurrentTabId } from '../../lib/requests/tabs';
import { makePing } from '../../lib/requests/makePing';
import { buildTabRequest } from '../../lib/requests/requestBuilder';

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

	return makePing(() => pingReq(actualTabId), timeout, delay)
		.then(() => true)
		.catch(() => false);
};
