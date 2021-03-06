import { langCode, langCodeWithAuto } from '@translate-tools/core/types/Translator';

import { buildBackendRequest } from '../utils/requestBuilder';
import { ITranslateOptions } from '@translate-tools/core/util/Scheduler/IScheduler';

export const [translateFactory, translateRequest] = buildBackendRequest<
	{
		text: string;
		from: langCodeWithAuto;
		to: langCode;
		options?: ITranslateOptions;
	},
	string
>('translate', {
	factoryHandler:
		({ bg }) =>
			async ({ text, from, to, options }) => {
				const scheduler = bg.scheduler;
				if (scheduler === undefined) {
					throw new Error('Scheduler is not ready');
				}

				return scheduler.translate(text, from, to, options);
			},
});

export const translate = (
	text: string,
	from: string,
	to: string,
	options?: ITranslateOptions,
) =>
	translateRequest({
		text,
		from: from as langCodeWithAuto,
		to: to as langCode,
		options,
	});
