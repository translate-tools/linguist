import { addRequestHandler, csSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';
import { ClientRequestHandlerFactory } from '../types';

export const PageTranslateStateSignature = type.type({
	resolved: type.number,
	rejected: type.number,
	pending: type.number,
});

export const getTranslateStateOut = type.type({
	isTranslated: type.boolean,
	counters: PageTranslateStateSignature,
	translateDirection: type.union([
		type.type({
			from: type.string,
			to: type.string,
		}),
		type.null,
	]),
});

export const getTranslateState = (tabId: number) =>
	csSendRequest(tabId, 'getTranslateState').then((rsp) =>
		tryDecode(getTranslateStateOut, rsp),
	);

export const getTranslateStateFactory: ClientRequestHandlerFactory = ({
	pageTranslator,
}) => {
	addRequestHandler('getTranslateState', async () => ({
		isTranslated: pageTranslator.isRun(),
		counters: pageTranslator.getStatus(),
		translateDirection: pageTranslator.getTranslateDirection(),
	}));
};
