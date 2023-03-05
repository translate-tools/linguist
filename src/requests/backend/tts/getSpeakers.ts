import { buildBackendRequest } from '../../utils/requestBuilder';

export const [getSpeakersFactory, getSpeakers] = buildBackendRequest('tts.getSpeakers', {
	factoryHandler:
		({ backgroundContext }) =>
			async () => {
				const ttsManager = backgroundContext.getTTSManager();
				return ttsManager.getSpeakers();
			},
});
