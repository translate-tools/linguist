import { tryDecode } from '../../../../lib/types';
import { PageTranslateStateSignature } from '../../../../requests/contentscript/pageTranslation/getPageTranslateState';
import { addRequestHandler, sendBackgroundRequest } from '../../../../requests/utils';

import { PageTranslatorStats } from '../PageTranslator';

const eventName = 'pageTranslatorStatsUpdated';

export const pageTranslatorStatsUpdated = (
	translateStats: PageTranslatorStats,
): Promise<void> => sendBackgroundRequest(eventName, translateStats);

export const pageTranslatorStatsUpdatedHandler = (
	handler: (stats: PageTranslatorStats, tabId?: number) => void,
) =>
	addRequestHandler(eventName, (rawData, sender) => {
		const stats = tryDecode(PageTranslateStateSignature, rawData);
		handler(stats, sender.tab?.id);
	});
