import { addRequestHandler, csSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { ClientRequestHandlerFactory } from '../../types';

export const PageTranslateStateSignature = type.type({
	resolved: type.number,
	rejected: type.number,
	pending: type.number,
});

export const getPageTranslateStateOut = type.type({
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

export const getPageTranslateState = (tabId: number) =>
	csSendRequest(tabId, 'getPageTranslateState').then((rsp) =>
		tryDecode(getPageTranslateStateOut, rsp),
	);

export const getPageTranslateStateFactory: ClientRequestHandlerFactory = ({
	pageTranslator,
}) => {
	addRequestHandler('getPageTranslateState', async () => ({
		isTranslated: pageTranslator.isRun(),
		counters: pageTranslator.getStatus(),
		translateDirection: pageTranslator.getTranslateDirection(),
	}));
};
