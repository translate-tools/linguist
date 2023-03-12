import { buildBackendRequest } from '../../utils/requestBuilder';

export const [getCustomSpeakersFactory, getCustomSpeakers] = buildBackendRequest(
	'tts.getCustomSpeakers',
	{
		factoryHandler:
			({ backgroundContext }) =>
				async () => {
					const ttsManager = backgroundContext.getTTSManager();
					return ttsManager.getCustomSpeakers();
				},
	},
);
