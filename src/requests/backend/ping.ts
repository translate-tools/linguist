import { addRequestHandler, bgSendRequest, pingSomething } from '../../lib/communication';
import { RequestHandlerFactory } from '../types';

export const ping = (options?: { timeout?: number; delay?: number }) => {
	const { timeout, delay } = options || {};
	return pingSomething(() => bgSendRequest('ping'), timeout, delay)
		.then(() => true)
		.catch(() => false);
};

export const pingFactory: RequestHandlerFactory = () => {
	addRequestHandler('ping', () => Promise.resolve('pong'));
};
