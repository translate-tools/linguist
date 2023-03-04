import { GoogleTTS, LingvaTTS } from '../../../lib/tts/speakers';

const embeddedSpeakers = {
	google: new GoogleTTS(),
	lingva: new LingvaTTS(),
} as const;

// TODO: implement logic to persistent add, update and remove speakers
export class TTSManager {
	public async getSpeakers() {
		return embeddedSpeakers;
	}
}
