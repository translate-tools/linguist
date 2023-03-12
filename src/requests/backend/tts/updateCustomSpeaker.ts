import { SerializedSpeaker } from '../../../app/Background/TTS/TTSStorage';
import { buildBackendRequest } from '../../utils/requestBuilder';

export const [updateCustomSpeakerFactory, updateCustomSpeaker] = buildBackendRequest(
	'tts.updateCustomSpeaker',
	{
		factoryHandler:
			({ config, backgroundContext }) =>
				async ({ id, ...speaker }: SerializedSpeaker & { id: string }) => {
					const ttsManager = backgroundContext.getTTSManager();
					await ttsManager.update(id, speaker);

					const { ttsModule } = await config.get();
					if (ttsModule === id) {
						const ttsController = await backgroundContext.getTTSController();
						ttsController.updateSpeaker();
					}
				},
	},
);
