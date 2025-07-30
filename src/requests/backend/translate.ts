import { ISchedulerTranslateOptions } from 'anylang/scheduling';

import { buildBackendRequest } from '../utils/requestBuilder';

export const [translateFactory, translateRequest] = buildBackendRequest<
	{
		text: string;
		from: string;
		to: string;
		options?: ISchedulerTranslateOptions;
	},
	string
>('translate', {
	factoryHandler:
		({ backgroundContext }) =>
		async ({ text, from, to, options }) => {
			const translateManager = await backgroundContext.getTranslateManager();

			const { supportedLanguages, isSupportAutodetect } =
				translateManager.getTranslatorFeatures();

			if (
				(from === 'auto' && !isSupportAutodetect) ||
				(from !== 'auto' && !supportedLanguages.includes(from))
			)
				throw new Error(
					'Source language is not supported by selected translator',
				);
			if (!supportedLanguages.includes(to))
				throw new Error(
					'Target language is not supported by selected translator',
				);

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
		from,
		to,
		options,
	});
