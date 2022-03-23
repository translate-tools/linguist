import { QueuePlayer } from './QueuePlayer';

export type UrlGetter = (options: { text: string; lang: string }) => Promise<string[]>;

export class TTSPlayer {
	private getTTS: UrlGetter;
	constructor(ttsGetter: UrlGetter) {
		this.getTTS = ttsGetter;

		this.player.onLoading = (state) => {
			console.warn('IS LOADING', state);

			this.isLoading = state;
			if (this.onLoading !== null) {
				this.onLoading(state);
			}
		};
	}

	private player = new QueuePlayer([]);

	private isLoading = false;
	public getIsLoading = () => this.isLoading;
	public onLoading: ((status: boolean) => void) | null = null;

	private ttsUrls: Promise<string[]> | null = null;
	public setOptions = (lang: string, text: string | null) => {
		this.player.stop();
		this.playerContext = {};
		this.ttsUrls = text === null ? Promise.resolve([]) : this.getTTS({ lang, text });
	};

	private playerContext = {};
	public play = async () => {
		if (this.ttsUrls === null) {
			throw new Error('Player is not configured');
		}

		const localContext = this.playerContext;

		const urls = await this.ttsUrls;

		// Skip by change context
		if (localContext !== this.playerContext) return;

		this.player.stop();
		this.player.setSrc(urls);
		this.player.play();
	};

	public stop = this.player.stop;
	public isPlayed = this.player.isPlayed;
}
