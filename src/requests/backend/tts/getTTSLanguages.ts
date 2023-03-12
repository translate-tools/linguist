import { buildBackendRequest } from '../../utils/requestBuilder';

export const [getTTSLanguagesFactory, getTTSLanguages] = buildBackendRequest(
	'tts.getTTSLanguages',
	{
		factoryHandler:
			({ backgroundContext }) =>
				async () => {
					const ttsManager = await backgroundContext.getTTSController();
					const tts = await ttsManager.getSpeaker();
					return tts.constructor.getSupportedLanguages();
				},
	},
);
