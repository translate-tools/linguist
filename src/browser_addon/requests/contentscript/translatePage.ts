import { addRequestHandler, csSendRequest } from '../../lib/communication';
import { tryDecodeObject, type } from '../../lib/types';
import { LangCodeWithAuto, LangCode } from '../../types/runtime';
import { ClientRequestHandlerFactory } from '../types';

export const translatePageIn = type.type({
	from: LangCodeWithAuto,
	to: LangCode,
});

export const translatePage = (tabId: number, from: string, to: string): Promise<void> =>
	csSendRequest(tabId, 'translatePage', { from, to });

export const translatePageFactory: ClientRequestHandlerFactory = ({
	pageTranslator,
	selectTranslatorRef,
	config,
}) => {
	addRequestHandler('translatePage', async (rawData) => {
		if (pageTranslator.isRun()) {
			throw new Error('Page already translated');
		}

		const { from, to } = tryDecodeObject(translatePageIn, rawData);

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
