import splitLongText from 'google-tts-api/dist/splitLongText';

import { detectLanguage } from '../../lib/language';
import { blobToBase64, base64ToBlob } from '../../lib/blob';
import { buildBackendRequest } from '../utils/requestBuilder';

// TODO: move getting TTS blob to standalone class
// TODO: implement option for select TTS speed
export const [getTTSFactory, getTTSReq] = buildBackendRequest('getTTS', {
	factoryHandler:
		() =>
			async ({ text, lang }: { text: string; lang: string }) => {
			// Fix lang auto to detected language
				if (lang === 'auto') {
					lang = (await detectLanguage(text, true)) || 'en';
				}

				const ttsEncodedBlobs = await Promise.all(
					splitLongText(text).map((text) => {
						const url =
						`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=dict-chrome-ex&ttsspeed=0.5&q=` +
						encodeURIComponent(text);

						return fetch(url)
							.then((rsp) => rsp.blob())
							.then(blobToBase64);
					}),
				);

				return ttsEncodedBlobs;
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

	const ttsBlobs = encodedBlobs.map((encodedBlob) =>
		base64ToBlob(encodedBlob.slice('data:audio/mpeg;base64,'.length), 'audio/mpeg'),
	);

	const ttsUrls = ttsBlobs.map((blob) => window.URL.createObjectURL(blob));
	return ttsUrls;
};
