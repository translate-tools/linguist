import { clearAllMocks } from '../../../../lib/tests';

import { embeddedSpeakers, TTSManager } from '..';

const audioSample = require('./audio-sample-uint-array.json');
const createSampleBlob = () =>
	new Blob([new Uint8Array(audioSample)], { type: 'audio/mpeg' });

const ttsClassSource = `class DemoTTS {
	getTextToSpeakBlob = async (text, language) => {
		return new Blob([new Uint8Array(${JSON.stringify(audioSample)})], { type: 'audio/mpeg' });
	}

	static getSupportedLanguages() {
		return ['en', 'de', 'ja'];
	}
}

DemoTTS;`;

const ttsDummyClassSource = `class DemoTTS {
	getTextToSpeakBlob = async (text, language) => {
		return new Blob([new Uint8Array(${JSON.stringify(audioSample)})], { type: 'audio/mpeg' });
	}

	static getSupportedLanguages() {
		return [];
	}
}

DemoTTS;`;

describe('TTS manager 0', () => {
	beforeEach(clearAllMocks);

	test('eval demo class', async () => {
		const ttsClass = eval(ttsClassSource);
		const tts = new ttsClass();
		const blob = await tts.getTextToSpeakBlob();
		expect(blob).toBeInstanceOf(Blob);
	});

	test('use custom TTS with TTSManager', async () => {
		const ttsManager = new TTSManager();

		const customTTSId = await ttsManager.add({
			name: 'Demo TTS',
			code: ttsClassSource,
		});

		const speakers = await ttsManager.getSpeakers();
		expect(Object.values(speakers).length).toBe(
			Object.keys(embeddedSpeakers).length + 1,
		);

		const customTTS = await ttsManager.getSpeaker(customTTSId);
		expect(typeof customTTS).toBe('function');

		const tts = new customTTS();
		const resultBlob = await tts.getTextToSpeakBlob('Text to speech demo', 'en');
		expect(resultBlob).toBeInstanceOf(Blob);

		const expectedBlob = createSampleBlob();
		expect(resultBlob.type).toBe(expectedBlob.type);

		const expectedText = await expectedBlob.text();
		const resultText = await resultBlob.text();
		expect(resultText).toBe(expectedText);
	});

	test('update TTS with TTSManager', async () => {
		const ttsManager = new TTSManager();

		const customTTSId = await ttsManager.add({
			name: 'Demo TTS',
			code: ttsDummyClassSource,
		});

		await ttsManager.getSpeakers().then((speakers) => {
			expect(speakers[customTTSId]).toBe('Demo TTS');
		});

		const customTTS = await ttsManager.getSpeaker(customTTSId);
		expect(typeof customTTS).toBe('function');
		expect(customTTS.getSupportedLanguages()).toEqual([]);

		await ttsManager.update(customTTSId, {
			name: 'Demo TTS - updated',
			code: ttsClassSource,
		});

		await ttsManager.getSpeakers().then((speakers) => {
			expect(speakers[customTTSId]).toBe('Demo TTS - updated');
		});

		const updatedCustomTTS = await ttsManager.getSpeaker(customTTSId);
		expect(typeof updatedCustomTTS).toBe('function');
		expect(updatedCustomTTS.getSupportedLanguages()).toEqual(['en', 'de', 'ja']);
	});
});
