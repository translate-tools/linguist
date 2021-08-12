import { addRequestHandler, csSendRequest } from '../../../lib/communication';
import { tryDecodeObject, type } from '../../../lib/types';
import { LangCodeWithAuto, LangCode } from '../../../types/runtime';
import { ClientRequestHandlerFactory } from '../../types';

export const enableTranslatePageIn = type.type({
	from: LangCodeWithAuto,
	to: LangCode,
});

export const enableTranslatePage = (
	tabId: number,
	from: string,
	to: string,
): Promise<void> => csSendRequest(tabId, 'enableTranslatePage', { from, to });

export const enableTranslatePageFactory: ClientRequestHandlerFactory = ({
	pageTranslator,
	selectTranslatorRef,
	config,
}) => {
	addRequestHandler('enableTranslatePage', async (rawData) => {
		if (pageTranslator.isRun()) {
			throw new Error('Page already translated');
		}

		const { from, to } = tryDecodeObject(enableTranslatePageIn, rawData);

		const selectTranslator = selectTranslatorRef.value;

		if (
			selectTranslator !== null &&
			selectTranslator.isRun() &&
			config.contentscript.selectTranslator.disableWhileTranslatePage
		) {
			selectTranslator.stop();
		}

		pageTranslator.run(from, to);
	});
};
