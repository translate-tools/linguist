import splitLongText from 'google-tts-api/dist/splitLongText';

import { buildBackendRequest } from '../utils/requestBuilder';

// TODO: remove objects which is unnecessary more
// TODO: move TTS to abstraction
export const [getTTSFactory, getTTS] = buildBackendRequest('getTTS', {
	factoryHandler:
		() =>
			async ({ text, lang }: { text: string; lang: string }) => {
				const ttsBlobs = await Promise.all(
					splitLongText(text).map((text) => {
						const url =
						`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=dict-chrome-ex&ttsspeed=0.5&q=` +
						encodeURIComponent(text);

						return fetch(url).then((rsp) => rsp.blob());
					}),
				);

				const ttsUrls = ttsBlobs.map((blob) => window.URL.createObjectURL(blob));

				return ttsUrls;
			},
});
