import splitLongText from 'google-tts-api/dist/splitLongText';

import { detectLanguage } from '../../lib/language';
import { blobToBase64, base64ToBlob } from '../../lib/blob';
import { GoogleTTS, LingvaTTS } from '../../lib/tts/speakers';
import { buildBackendRequest } from '../utils/requestBuilder';

const TTSMap = {
	google: new GoogleTTS(),
	lingva: new LingvaTTS(),
} as const;

// TODO: implement option for select TTS speed
export const [getTTSFactory, getTTSReq] = buildBackendRequest('getTTS', {
	factoryHandler:
		({ config }) =>
			async ({ text, lang }: { text: string; lang: string }) => {
			// Fix lang auto to detected language
				if (lang === 'auto') {
					lang = (await detectLanguage(text, true)) || 'en';
				}

				const { ttsModule } = await config.get();
				if (!(ttsModule in TTSMap)) {
					throw new Error('TTS module not found');
				}

				const tts = TTSMap[ttsModule as keyof typeof TTSMap];
				return Promise.all(
					splitLongText(text).map((text) =>
						tts.getTextToSpeakBlob(text, lang).then(blobToBase64),
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
