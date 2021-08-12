import { addRequestHandler, csSendRequest } from '../../../lib/communication';
import { ClientRequestHandlerFactory } from '../../types';

export const disableTranslatePage = (tabId: number): Promise<void> =>
	csSendRequest(tabId, 'disableTranslatePage');

export const disableTranslatePageFactory: ClientRequestHandlerFactory = ({
	pageTranslator,
	selectTranslatorRef,
}) => {
	addRequestHandler('disableTranslatePage', async () => {
		if (!pageTranslator.isRun()) {
			throw new Error('Page is not translated');
		}

		const selectTranslator = selectTranslatorRef.value;

		pageTranslator.stop();

		if (selectTranslator !== null && !selectTranslator.isRun()) {
			selectTranslator.start();
		}
	});
};
