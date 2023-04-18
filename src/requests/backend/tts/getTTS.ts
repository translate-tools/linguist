import splitLongText from 'google-tts-api/dist/splitLongText';

import { base64ToBlob, blobToBase64 } from '../../../lib/blob';
import { detectLanguage } from '../../../lib/language';
import { buildBackendRequest } from '../../utils/requestBuilder';

// TODO: implement option for select TTS speed
export const [getTTSFactory, getTTSReq] = buildBackendRequest('tts.getTTS', {
	factoryHandler:
		({ backgroundContext }) =>
			async ({ text, lang }: { text: string; lang: string }) => {
			// Fix lang auto to detected language
				if (lang === 'auto') {
					lang = (await detectLanguage(text, true)) || 'en';
				}

				const ttsController = await backgroundContext.getTTSController();
				const tts = await ttsController.getSpeaker();
				return Promise.all(
					splitLongText(text).map((text) =>
						tts.instance
							.getAudioBuffer(text, lang)
							.then((audio) =>
								blobToBase64(new Blob([audio.buffer], { type: audio.type })),
							),
					),
				);
			},
});

/**
 * Wrapper on `getTTSReq` which decode base64 strings to blobs and make blob urls
 *
 * This architecture is one which work
 * - We must serialize data between requests
 * - We must use encode/decode instead blob urls, due to CORS limitations for content script
 */
export const getTTS = async (options: { text: string; lang: string }) => {
	const encodedBlobs = await getTTSReq(options);

	const ttsBlobs = encodedBlobs.map((encodedBlob) => {
		const prefix = 'data:audio/mpeg;base64,';
		const slice = encodedBlob.slice(prefix.length);
		return base64ToBlob(slice, 'audio/mpeg');
	});

	const ttsUrls = ttsBlobs.map((blob) => window.URL.createObjectURL(blob));
	return ttsUrls;
};
