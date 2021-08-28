import splitLongText from 'google-tts-api/dist/splitLongText';

import { detectLanguage } from '../../lib/language';
import { buildBackendRequest } from '../utils/requestBuilder';

// TODO: move getting TTS blob to standalone class
// TODO: remove objects which is unnecessary more with command `window.URL.revokeObjectURL`
// TODO: add TTS for select translator and for dictionary
// TODO: implement option for select TTS speed
export const [getTTSFactory, getTTS] = buildBackendRequest('getTTS', {
	factoryHandler:
		() =>
			async ({ text, lang }: { text: string; lang: string }) => {
			// Fix lang auto to detected language
				if (lang === 'auto') {
					lang = (await detectLanguage(text, true)) || 'en';
				}

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
