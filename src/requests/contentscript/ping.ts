import {
	addRequestHandler,
	csSendRequest,
	getCurrentTabId,
	pingSomething,
} from '../../lib/communication';
import { ClientRequestHandlerFactory } from '../types';

export const ping = async (timeout?: number, tabId?: number) => {
	const actualTabId = tabId ?? (await getCurrentTabId());

	return pingSomething(() => csSendRequest(actualTabId, 'ping'), timeout)
		.then(() => true)
		.catch(() => false);
};

export const pingFactory: ClientRequestHandlerFactory = () => {
	addRequestHandler('ping', async () => 'pong');
};
