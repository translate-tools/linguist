import { buildBackendRequest } from '../../utils/requestBuilder';

// TODO: reset TTS to embedded
export const [deleteCustomSpeakerFactory, deleteCustomSpeaker] = buildBackendRequest(
	'tts.deleteCustomSpeaker',
	{
		factoryHandler:
			({ config, backgroundContext }) =>
				async (id: string) => {
					const ttsManager = backgroundContext.getTTSManager();
					await ttsManager.delete(id);

					const { ttsModule } = await config.get();
					if (ttsModule === id) {
						const ttsController = await backgroundContext.getTTSController();
						ttsController.updateSpeaker();
					}
				},
	},
);
