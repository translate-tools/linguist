import { GoogleTTS, LingvaTTS, TTSProvider } from '../../../lib/tts/speakers';

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
export const ttsIdToKey = (id: string): TTSKey => (isCustomTTSId(id) ? id.slice(1) : id);

// TODO: implement logic to persistent add, update and remove speakers
export class TTSManager {
	private storage;
	constructor() {
		this.storage = new TTSStorage();
	}

	public async getSpeakers() {
		const speakers: Record<string, TTSProvider> = Object.fromEntries(
			Object.entries(embeddedSpeakers).map(([id, { constructor }]) => [
				id,
				constructor,
			]),
		);

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

		const key = await this.storage.add(speaker);
		return ttsKeyToId(key);
	}

	public async delete(id: TTSKey) {
		const key = ttsIdToKey(id);
		return this.storage.delete(key);
	}
}
