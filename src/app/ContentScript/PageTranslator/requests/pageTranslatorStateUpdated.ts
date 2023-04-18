import { addRequestHandler, sendBackgroundRequest } from '../../../../requests/utils';

import { PageTranslatorState } from '../PageTranslatorController';

const eventName = 'pageTranslatorStateUpdated';

export const pageTranslatorStateUpdated = (
	translateState: PageTranslatorState,
): Promise<void> => sendBackgroundRequest(eventName, translateState);

export const pageTranslatorStateUpdatedHandler = (
	handler: (state: PageTranslatorState, tabId?: number) => void,
) =>
	addRequestHandler(eventName, (state, sender) => {
		handler(state, sender.tab?.id);
	});
