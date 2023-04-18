import { TTSProvider } from '@translate-tools/core/tts';
import { GoogleTTS } from '@translate-tools/core/tts/GoogleTTS';
import { LingvaTTS } from '@translate-tools/core/tts/LingvaTTS';

import { SerializedSpeaker, TTSKey, TTSStorage } from '../TTSStorage';
import { tryLoadTTSCode } from './ttsLoader';

export type CustomTTS = SerializedSpeaker & {
	/**
	 * Unique module identifier
	 */
	id: string;
};

export type EmbeddedSpeaker = {
	name: string;
	constructor: TTSProvider;
};

export const embeddedSpeakers: Record<string, EmbeddedSpeaker> = {
	google: {
		name: 'Google TTS',
		constructor: GoogleTTS,
	},
	lingva: {
		name: 'Lingva',
		constructor: LingvaTTS,
	},
};

export const customTTSPrefix = '#custom:';
export const isCustomTTSId = (id: string) => id.startsWith(customTTSPrefix);
export const ttsKeyToId = (key: TTSKey) => customTTSPrefix + key;
export const ttsIdToKey = (id: string): TTSKey =>
	Number(isCustomTTSId(id) ? id.slice(customTTSPrefix.length) : id);

/**
 * Validate speaker structure and throw error if speaker is not valid
 * Ensure the speaker code is correct
 */
const speakerValidatorGuard = (speaker: SerializedSpeaker) => {
	if (speaker.name.trim().length === 0) {
		throw new Error('Name must not be empty');
	}

	const { error } = tryLoadTTSCode(speaker.code);
	if (error !== null) {
		throw new Error(error);
	}
};

/**
 * Controller that manage a text to speech modules
 */
export class TTSManager {
	private storage;
	constructor() {
		this.storage = new TTSStorage();
	}

	public async getSpeaker(id: string) {
		if (!isCustomTTSId(id)) {
			if (id in embeddedSpeakers) {
				return embeddedSpeakers[id].constructor;
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

	public async getCustomSpeakers(): Promise<CustomTTS[]> {
		const customSpeakers = await this.storage.getAll();
		return customSpeakers.map(({ id, data: { name, code } }) => ({
			id: ttsKeyToId(id),
			name,
			code,
		}));
	}

	public async add(speaker: SerializedSpeaker) {
		speakerValidatorGuard(speaker);
		const key = await this.storage.add(speaker);
		return ttsKeyToId(key);
	}

	public async update(id: string, speaker: SerializedSpeaker) {
		speakerValidatorGuard(speaker);
		const key = ttsIdToKey(id);
		await this.storage.update(key, speaker);
	}

	public async delete(id: string) {
		const key = ttsIdToKey(id);
		return this.storage.delete(key);
	}
}
