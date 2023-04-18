import { readFileSync } from 'fs';
import path from 'path';
import { TTSProviderProps } from '@translate-tools/core/tts';

import { clearAllMocks } from '../../../../../lib/tests';

import { TTSManager } from '..';

const audioSampleBuffer = readFileSync(path.join(__dirname, 'sample.mp3'));
const audioSampleBytes = Array.from(new Uint8Array(audioSampleBuffer.buffer));

const createSampleBlob = () =>
	new Blob([new Uint8Array(audioSampleBytes)], { type: 'audio/mpeg' });

const ttsClassSource = `class DemoTTS {
	getAudioBuffer = async (text, language) => {
		return {
			type: 'audio/mpeg',
			buffer: (new Uint8Array(${JSON.stringify(audioSampleBytes)})).buffer,
		};
	}

	static getSupportedLanguages() {
		return ['en', 'de', 'ja'];
	}
}

DemoTTS;`;

const ttsDummyClassSource = `class DemoTTS {
	getAudioBuffer = async (text, language) => {
		return {
			type: 'audio/mpeg',
			buffer: (new Uint8Array([])).buffer,
		};
	}

	static getSupportedLanguages() {
		return [];
	}
}

DemoTTS;`;

describe('TTS manager use cases', () => {
	beforeEach(clearAllMocks);

	test('eval demo class', async () => {
		const ttsClass = eval(ttsClassSource);
		const tts: TTSProviderProps = new ttsClass();
		const audio = await tts.getAudioBuffer('', '');
		expect(audio.buffer).toBeInstanceOf(ArrayBuffer);
	});

	test('use custom TTS with TTSManager', async () => {
		const ttsManager = new TTSManager();

		const customTTSId = await ttsManager.add({
			name: 'Demo TTS',
			code: ttsClassSource,
		});

		await ttsManager.getCustomSpeakers().then((customSpeakers) => {
			expect(customSpeakers.length).toBe(1);
		});

		await ttsManager.add({
			name: 'TTS #2',
			code: ttsClassSource,
		});

		await ttsManager.getCustomSpeakers().then((customSpeakers) => {
			expect(customSpeakers.length).toBe(2);
		});

		const customTTS = await ttsManager.getSpeaker(customTTSId);
		expect(typeof customTTS).toBe('function');

		const tts = new customTTS();
		const resultBuffer = await tts.getAudioBuffer('Text to speech demo', 'en');
		expect(resultBuffer.buffer).toBeInstanceOf(ArrayBuffer);

		const resultBlob = new Blob([resultBuffer.buffer], { type: resultBuffer.type });
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
