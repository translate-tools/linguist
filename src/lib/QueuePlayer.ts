/**
 * Player which can play multiple sources one by one
 */
export class QueuePlayer {
	private srcList: string[] = [];
	private player: HTMLAudioElement | null = null;
	private srcIndex: number = 0;

	constructor(srcList: string[]) {
		this.setSrc(srcList);
	}

	// Play next source by end current
	private nextSourcePusher = () => {
		if (this.player === null) return;

		let isEnd = false;
		if (++this.srcIndex >= this.srcList.length) {
			this.srcIndex = 0;
			isEnd = true;
		}

		const nextSrc = this.srcList[this.srcIndex];
		this.player.src = nextSrc;

		// Continue play if it is not last segment
		if (!isEnd) {
			this.player.play();
		}
	};

	private loadHandler = (evt: Event) => {
		if (this.onLoading === null) return;

		switch (evt.type) {
		case 'waiting':
			this.onLoading(true);
			break;
		case 'canplaythrough':
			this.onLoading(false);
			break;
		}
	};

	public setSrc = (srcList: string[]) => {
		// Destroy player
		if (this.player !== null) {
			this.player.pause();

			this.player.removeEventListener('ended', this.nextSourcePusher);
			this.player.removeEventListener('canplaythrough', this.loadHandler);
			this.player.removeEventListener('waiting', this.loadHandler);

			this.player = null;
		}

		this.srcList = srcList;
		this.srcIndex = 0;
	};

	public onLoading: ((status: boolean) => void) | null = null;

	public play = () => {
		// Init player with first source
		if (this.player === null) {
			const url = this.srcList[0];
			this.player = new Audio(url);
			this.player.addEventListener('ended', this.nextSourcePusher);
			this.player.addEventListener('canplaythrough', this.loadHandler);
			this.player.addEventListener('waiting', this.loadHandler);
		}

		// Play if on pause
		if (this.player.paused) {
			this.player.play();
		}
	};

	public pause = () => {
		if (this.player !== null) {
			this.player.pause();
		}
	};

	/**
	 * Stop playing and set first source at 0:00
	 */
	public stop = () => {
		if (this.player === null) return;

		// Pause
		this.player.pause();

		// Set first src
		this.srcIndex = 0;
		this.player.src = this.srcList[this.srcIndex];

		// Set start time
		this.player.currentTime = 0;
	};

	public isPlayed = () => {
		return this.player === null ? false : !this.player.paused;
	};
}
