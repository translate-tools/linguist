import { buildBackendRequest } from '../../utils/requestBuilder';

export const [deleteCustomSpeakerFactory, deleteCustomSpeaker] = buildBackendRequest(
	'tts.deleteCustomSpeaker',
	{
		factoryHandler:
			({ backgroundContext }) =>
				async (id: string) => {
					const ttsManager = backgroundContext.getTTSManager();
					return ttsManager.delete(id);
				},
	},
);
