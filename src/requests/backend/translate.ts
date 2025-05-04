import { ISchedulerTranslateOptions } from '@translate-tools/core/scheduling';
import { langCode, langCodeWithAuto } from '@translate-tools/core/translators/Translator';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [translateFactory, translateRequest] = buildBackendRequest<
	{
		text: string;
		from: langCodeWithAuto;
		to: langCode;
		options?: ISchedulerTranslateOptions;
	},
	string
>('translate', {
	factoryHandler:
		({ backgroundContext }) =>
			async ({ text, from, to, options }) => {
				const translateManager = await backgroundContext.getTranslateManager();
				const scheduler = translateManager.getScheduler();
				return scheduler.translate(text, from, to, options);
			},
});
export const translate = (
	text: string,
	from: string,
	to: string,
	options?: ISchedulerTranslateOptions,
) =>
	translateRequest({
		text,
		from: from as langCodeWithAuto,
		to: to as langCode,
		options,
	});
