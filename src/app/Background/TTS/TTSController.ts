import { TTSProviderProps, TTSProviderStaticProps } from '@translate-tools/core/tts';

import { TTSManager } from './TTSManager';

export class TTSController {
	private ttsManager;
	private speakerId;
	constructor(ttsManager: TTSManager, speakerId: string) {
		this.ttsManager = ttsManager;
		this.speakerId = speakerId;
	}

	private speaker: Promise<{
		constructor: TTSProviderStaticProps;
		instance: TTSProviderProps;
	}> | null = null;
	public updateSpeaker(speakerId?: string) {
		if (speakerId !== undefined) {
			this.speakerId = speakerId;
		}

		this.speaker = this.ttsManager
			.getSpeaker(this.speakerId)
			.then((ttsConstructor) => {
				const tts = new ttsConstructor();
				return {
					constructor: ttsConstructor,
					instance: tts,
				};
			});

		return this.speaker;
	}

	public getSpeaker() {
		if (this.speaker !== null) return this.speaker;

		const speakerPromise = this.updateSpeaker();
		return speakerPromise;
	}
}
