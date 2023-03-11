import { TTSProviderProps } from '@translate-tools/core/tts';
import { TTSManager } from '.';

export class TTSController {
	private ttsManager;
	private speakerId;
	constructor(ttsManager: TTSManager, speakerId: string) {
		this.ttsManager = ttsManager;
		this.speakerId = speakerId;
	}

	private speaker: Promise<TTSProviderProps> | null = null;
	public updateSpeaker(speakerId?: string) {
		if (speakerId !== undefined) {
			this.speakerId = speakerId;
		}

		this.speaker = this.ttsManager.getSpeaker(this.speakerId).then((ttsClass) => {
			const tts = new ttsClass();
			return tts;
		});

		return this.speaker;
	}

	public getSpeaker() {
		if (this.speaker !== null) return this.speaker;

		const speakerPromise = this.updateSpeaker();
		return speakerPromise;
	}
}
