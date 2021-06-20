import { addRequestHandler, csSendRequest } from '../../lib/communication';
import { ClientRequestHandlerFactory } from '../types';

export const untranslatePage = (tabId: number): Promise<void> =>
	csSendRequest(tabId, 'untranslatePage');

export const untranslatePageFactory: ClientRequestHandlerFactory = ({
	pageTranslator,
	selectTranslatorRef,
}) => {
	addRequestHandler('untranslatePage', async () => {
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
