import {
	addRequestHandler,
	csSendRequest,
	getCurrentTabId,
	pingSomething,
} from '../../lib/communication';
import { ClientRequestHandlerFactory } from '../types';

export const ping = async (options?: {
	timeout?: number;
	tabId?: number;
	delay?: number;
}) => {
	const { timeout, tabId, delay } = options || {};

	const actualTabId = tabId ?? (await getCurrentTabId());

	return pingSomething(() => csSendRequest(actualTabId, 'ping'), timeout, delay)
		.then(() => true)
		.catch(() => false);
};

export const pingFactory: ClientRequestHandlerFactory = () => {
	addRequestHandler('ping', async () => 'pong');
};
