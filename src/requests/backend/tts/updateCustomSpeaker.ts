import { SerializedSpeaker } from '../../../app/Background/TTSManager/TTSStorage';
import { buildBackendRequest } from '../../utils/requestBuilder';

export const [updateCustomSpeakerFactory, updateCustomSpeaker] = buildBackendRequest(
	'tts.updateCustomSpeaker',
	{
		factoryHandler:
			({ backgroundContext }) =>
				async ({ id, ...speaker }: SerializedSpeaker & { id: string }) => {
					const ttsManager = backgroundContext.getTTSManager();
					return ttsManager.update(id, speaker);
				},
	},
);
