import { getCurrentTabId } from '../../lib/browser/tabs';

import { makePing } from '../utils/makePing';
import { buildTabRequest } from '../utils/requestBuilder';

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
