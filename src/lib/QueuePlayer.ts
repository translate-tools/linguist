// TODO: implement method `setSrc` to avoid create new player each time for change sources

/**
 * Player which can play multiple sources one by one
 */
export class QueuePlayer {
	private srcList: string[];
	constructor(srcList: string[]) {
		this.srcList = srcList;
	}

	private player: HTMLAudioElement | null = null;
	private srcIndex: number = 0;

	public play = () => {
		// Init player with first source
		if (this.player === null) {
			const url = this.srcList[0];
			this.player = new Audio(url);

			// Play next source by end current
			const nextSourcePusher = () => {
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

			this.player.addEventListener('ended', nextSourcePusher);
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
