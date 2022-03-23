import { QueuePlayer } from './QueuePlayer';

export type UrlGetter = (options: { text: string; lang: string }) => Promise<string[]>;

export class TTSPlayer {
	private player = new QueuePlayer([]);

	private getTTS: UrlGetter;
	constructor(ttsGetter: UrlGetter) {
		this.getTTS = ttsGetter;

		this.player.onLoading = this.setLoadingState;
	}

	public getIsLoading = () => this.isLoading;
	public onLoading: ((status: boolean) => void) | null = null;

	private isLoading = false;
	private setLoadingState = (state: boolean) => {
		console.warn('IS LOADING', state);

		this.isLoading = state;
		if (this.onLoading !== null) {
			this.onLoading(state);
		}
	};

	private options: { lang: string; text: string | null } | null = null;
	private ttsUrls: Promise<string[]> | null = null;
	public setOptions = (lang: string, text: string | null) => {
		// Remove TTS urls for previous state
		if (
			this.options !== null &&
			this.options.lang !== lang &&
			this.options.text !== text
		) {
			this.ttsUrls = null;
			this.playerContext = {};
		}

		this.player.stop();
		this.options = { lang, text };
	};

	private playerContext = {};
	public play = async () => {
		if (this.options === null) {
			throw new Error('Player is not configured');
		}

		const { lang, text } = this.options;

		if (text === null) return;

		const localContext = this.playerContext;

		// Load urls
		if (this.ttsUrls === null) {
			this.ttsUrls = this.getTTS({ lang, text });
			this.setLoadingState(true);
		}

		const urls = await this.ttsUrls;

		// Skip by change context
		if (localContext !== this.playerContext) return;

		this.player.stop();
		this.player.setSrc(urls);
		this.player.play();
	};

	public toggle = () => {
		if (this.isPlayed()) {
			this.stop();
		} else {
			this.play();
		}
	};

	public stop = () => {
		this.player.stop();
		this.setLoadingState(false);
	};
	public isPlayed = this.player.isPlayed;
}
