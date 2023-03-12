import { DEFAULT_TTS } from '../../../config';
import { buildBackendRequest } from '../../utils/requestBuilder';

export const [deleteCustomSpeakerFactory, deleteCustomSpeaker] = buildBackendRequest(
	'tts.deleteCustomSpeaker',
	{
		factoryHandler:
			({ config, backgroundContext }) =>
				async (id: string) => {
					const actualConfig = await config.get();
					const isCurrentModule = actualConfig.ttsModule === id;

					// reset TTS to embedded
					if (isCurrentModule) {
						config.set({
							...actualConfig,
							ttsModule: DEFAULT_TTS,
						});
					}

					const ttsManager = backgroundContext.getTTSManager();
					await ttsManager.delete(id);

					if (isCurrentModule) {
						const ttsController = await backgroundContext.getTTSController();
						ttsController.updateSpeaker();
					}
				},
	},
);
