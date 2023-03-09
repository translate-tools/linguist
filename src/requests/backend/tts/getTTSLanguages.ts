import { buildBackendRequest } from '../../utils/requestBuilder';

export const [getTTSLanguagesFactory, getTTSLanguages] = buildBackendRequest(
	'tts.getTTSLanguages',
	{
		factoryHandler:
			({ config, backgroundContext }) =>
				async () => {
					const cfg = await config.get();
					const ttsManager = backgroundContext.getTTSManager();
					const ttsSpeakerClass = await ttsManager.getSpeaker(cfg.ttsModule);
					return ttsSpeakerClass.getSupportedLanguages();
				},
	},
);
