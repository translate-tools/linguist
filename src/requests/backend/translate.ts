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
