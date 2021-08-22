import { TypeOf } from 'io-ts';

import { PageTranslateStateSignature } from '../../../requests/contentscript/pageTranslation/getPageTranslateState';
import { addRequestHandler, sendBackgroundRequest } from '../../../lib/requests';
import { tryDecode } from '../../../lib/types';

type CountersObject = TypeOf<typeof PageTranslateStateSignature>;

export const translateStateUpdate = (translateState: CountersObject): Promise<void> =>
	sendBackgroundRequest('translateStateUpdate', translateState);

export const translateStateUpdateHandler = (
	handler: (counters: CountersObject, tabId?: number) => void,
) =>
	addRequestHandler('translateStateUpdate', (rawData, sender) => {
		const counters = tryDecode(PageTranslateStateSignature, rawData);
		handler(counters, sender.tab?.id);
	});
