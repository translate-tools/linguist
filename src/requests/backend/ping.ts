import { addRequestHandler, bgSendRequest, pingSomething } from '../../lib/communication';
import { RequestHandlerFactory } from '../types';

export const ping = (timeout?: number) => {
	return pingSomething(() => bgSendRequest('ping'), timeout)
		.then(() => true)
		.catch(() => false);
};

export const pingFactory: RequestHandlerFactory = () => {
	addRequestHandler('ping', () => Promise.resolve('pong'));
};
