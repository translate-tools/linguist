import { GoogleTTS, LingvaTTS, TTSProvider } from '../../../lib/tts/speakers';

import { SerializedSpeaker, TTSKey, TTSStorage } from './TTSStorage';
import { tryLoadTTSCode } from './utils';

const embeddedSpeakers = {
	google: GoogleTTS,
	lingva: LingvaTTS,
} as const;

export const isCustomTTSId = (id: string) => id.startsWith('#');
export const ttsKeyToId = (id: TTSKey) => '#' + id;

// TODO: implement logic to persistent add, update and remove speakers
export class TTSManager {
	private storage;
	constructor() {
		this.storage = new TTSStorage();
	}

	public async getSpeakers() {
		const speakers: Record<string, TTSProvider> = { ...embeddedSpeakers };

		// Collect custom speakers
		const customSpeakers = await this.storage.getAll();
		for (const customSpeaker of customSpeakers) {
			const id = ttsKeyToId(customSpeaker.id);
			const { constructor, error } = tryLoadTTSCode(customSpeaker.data.code);

			if (constructor === null) {
				console.warn(`Skip translator #${id}`, error);
				continue;
			}

			speakers[id] = constructor;
		}

		return speakers;
	}

	// TODO: implement method
	// public async getSpeakersNames() {
	// 	return embeddedSpeakers;
	// }

	public async add(speaker: SerializedSpeaker) {
		const { error } = tryLoadTTSCode(speaker.code);
		if (error !== null) {
			throw new Error(error);
		}

		return this.storage.add(speaker);
	}

	public async delete(id: TTSKey) {
		return this.storage.delete(id);
	}
}
