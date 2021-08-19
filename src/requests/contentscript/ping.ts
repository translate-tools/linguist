import {
	addRequestHandler,
	csSendRequest,
	getCurrentTabId,
	pingSomething,
} from '../../lib/communication';
import { ClientRequestHandlerFactory } from '../types';

export const ping = async ({
	timeout,
	tabId,
	delay,
}: {
	timeout?: number;
	tabId?: number;
	delay?: number;
}) => {
	const actualTabId = tabId ?? (await getCurrentTabId());

	return pingSomething(() => csSendRequest(actualTabId, 'ping'), timeout, delay)
		.then(() => true)
		.catch(() => false);
};

export const pingFactory: ClientRequestHandlerFactory = () => {
	addRequestHandler('ping', async () => 'pong');
};
