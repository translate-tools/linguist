import { GoogleTTS, LingvaTTS } from '../../../lib/tts/speakers';

import { SerializedSpeaker, TTSKey, TTSStorage } from './TTSStorage';
import { tryLoadTTSCode } from './utils';

export const embeddedSpeakers = {
	google: {
		name: 'Google translator',
		constructor: GoogleTTS,
	},
	lingva: {
		name: 'Lingva',
		constructor: LingvaTTS,
	},
} as const;

export const isCustomTTSId = (id: string) => id.startsWith('#');
export const ttsKeyToId = (key: TTSKey) => '#' + key;
export const ttsIdToKey = (id: string): TTSKey =>
	Number(isCustomTTSId(id) ? id.slice(1) : id);

const validateSpeaker = (speaker: SerializedSpeaker) => {
	if (speaker.name.trim().length === 0) {
		throw new Error('Name must not be empty');
	}

	const { error } = tryLoadTTSCode(speaker.code);
	if (error !== null) {
		throw new Error(error);
	}
};

// TODO: implement update speaker
export class TTSManager {
	private storage;
	constructor() {
		this.storage = new TTSStorage();
	}

	public async getSpeaker(id: string) {
		if (!isCustomTTSId(id)) {
			if (id in embeddedSpeakers) {
				return embeddedSpeakers[id as keyof typeof embeddedSpeakers].constructor;
			}

			throw new Error('Not found embedded TTS');
		}

		const ttsKey = ttsIdToKey(id);
		const speaker = await this.storage.get(ttsKey);
		if (speaker === undefined) {
			throw new Error('Not found custom TTS');
		}

		const { error, constructor } = tryLoadTTSCode(speaker.code);
		if (error !== null) {
			throw new Error(error);
		}

		return constructor;
	}

	public async getSpeakers() {
		const speakers: Record<string, string> = Object.fromEntries(
			Object.entries(embeddedSpeakers).map(([id, { name }]) => [id, name]),
		);

		// Collect custom speakers
		const customSpeakers = await this.storage.getAll();
		for (const customSpeaker of customSpeakers) {
			const id = ttsKeyToId(customSpeaker.id);
			speakers[id] = customSpeaker.data.name;
		}

		return speakers;
	}

	public async add(speaker: SerializedSpeaker) {
		validateSpeaker(speaker);
		const key = await this.storage.add(speaker);
		return ttsKeyToId(key);
	}

	public async update(id: string, speaker: SerializedSpeaker) {
		validateSpeaker(speaker);
		const key = ttsIdToKey(id);
		await this.storage.update(key, speaker);
	}

	public async delete(id: string) {
		const key = ttsIdToKey(id);
		return this.storage.delete(key);
	}
}
