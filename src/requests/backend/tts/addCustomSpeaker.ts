import { SerializedSpeaker } from '../../../app/Background/TTSManager/TTSStorage';
import { buildBackendRequest } from '../../utils/requestBuilder';

export const [addCustomSpeakerFactory, addCustomSpeaker] = buildBackendRequest(
	'tts.addCustomSpeaker',
	{
		factoryHandler:
			({ backgroundContext }) =>
				async (speaker: SerializedSpeaker) => {
					const ttsManager = backgroundContext.getTTSManager();
					return ttsManager.add(speaker);
				},
	},
);
