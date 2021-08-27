// TODO: refactor

import { buildBackendRequest } from '../utils/requestBuilder';

const blobToText = (blob: Blob) => {
	return new Promise<any[]>((res) => {
		const reader = new FileReader();

		// This fires after the blob has been read/loaded.
		reader.addEventListener('loadend', (e) => {
			const text = (e.srcElement as any).result;

			console.warn({ text });

			res(Array.apply(null, new Uint8Array(text) as any));
		});

		// Start reading the blob as text.
		reader.readAsArrayBuffer(blob);
	});
};

// TODO: move TTS to abstraction
export const [getTTSFactory, getTTSReq] = buildBackendRequest('getTTS', {
	factoryHandler:
		() =>
			async ({ text, lang }: { text: string; lang: string }) => {
				const url =
				`https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=dict-chrome-ex&ttsspeed=0.5&q=` +
				encodeURIComponent(text);
				const blob = await fetch(url).then((rsp) => rsp.blob());
				console.warn({ originalBlob: blob });

				return blobToText(blob);
			},
});

// Serialize on backend and deserialize on frontend to make it work in chrome
export const getTTS = (options: { text: string; lang: string }) =>
	getTTSReq(options).then(
		(source) => new Blob([new Uint8Array(source).buffer], { type: 'audio/mpeg' }),
	);
