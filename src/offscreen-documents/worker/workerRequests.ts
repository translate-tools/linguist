import { buildBackendRequest } from '../../requests/utils/requestBuilder';

export const [createWorkerFactory, createWorker] = buildBackendRequest<string, string>(
	'offscreenWorker.create',
	{
		factoryHandler: () => async () => 'pong' as const,
	},
);
