import { langCode, langCodeWithAuto } from '@translate-tools/core/types/Translator';

import { buildBackendRequest } from '../../lib/requestBuilder';
import { type } from '../../lib/types';
import { LangCode, LangCodeWithAuto } from '../../types/runtime';

export const [translateFactory, translateRequest] = buildBackendRequest('translate', {
	requestValidator: type.type({
		text: type.string,
		from: LangCodeWithAuto,
		to: LangCode,
		context: type.union([type.string, type.undefined]),
	}),

	responseValidator: type.string,

	factoryHandler:
		({ bg }) =>
			async ({ text, from, to, context }) => {
				const scheduler = bg.scheduler;
				if (scheduler === undefined) {
					throw new Error('Scheduler is not ready');
				}

				return scheduler.translate(text, from, to, { context });
			},
});

export const translate = (text: string, from: string, to: string, context?: string) =>
	translateRequest({
		text,
		from: from as langCodeWithAuto,
		to: to as langCode,
		context,
	});
