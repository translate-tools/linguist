import { TypeOf } from 'io-ts';

import { PageTranslateStateSignature } from '../../../requests/contentscript/getTranslateState';
import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode } from '../../../lib/types';

type CountersObject = TypeOf<typeof PageTranslateStateSignature>;

export const translateStateUpdate = (translateState: CountersObject): Promise<void> =>
	bgSendRequest('translateStateUpdate', translateState);

export const translateStateUpdateHandler = (
	handler: (counters: CountersObject, tabId?: number) => void,
) =>
	addRequestHandler('translateStateUpdate', (rawData, sender) => {
		const counters = tryDecode(PageTranslateStateSignature, rawData);
		handler(counters, sender.tab?.id);
	});
