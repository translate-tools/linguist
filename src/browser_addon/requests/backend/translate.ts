import { addRequestHandler, bgSendRequest } from '../../lib/communication';
import { tryDecode, type } from '../../lib/types';
import { LangCode, LangCodeWithAuto } from '../../types/runtime';
import { RequestHandlerFactory } from '../types';

export const translateIn = type.type({
	text: type.string,
	from: LangCodeWithAuto,
	to: LangCode,
	context: type.union([type.string, type.undefined]),
});

export const translateOut = type.string;

export const translate = (text: string, from: string, to: string, context?: string) =>
	bgSendRequest('translate', {
		text,
		from,
		to,
		context,
	}).then((translate) => tryDecode(translateOut, translate));

export const translateFactory: RequestHandlerFactory = ({ bg }) => {
	addRequestHandler('translate', async (rawData) => {
		const scheduler = bg.scheduler;
		if (scheduler === undefined) {
			throw new Error('Scheduler is not ready');
		}

		const { text, from, to, context } = tryDecode(translateIn, rawData);
		return scheduler.translate(text, from, to, { context });
	});
};
