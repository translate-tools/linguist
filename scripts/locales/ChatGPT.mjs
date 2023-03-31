import { ChatGPTUnofficialProxyAPI } from 'chatgpt';

/**
 * Interface to ChatGPT that ensure smooth use
 */
export class ChatGPT {
	/**
	 * Delay between messages
	 */
	_delay = 1000;

	constructor() {
		this.api = new ChatGPTUnofficialProxyAPI({
			accessToken: process.env.GPT_ACCESS_TOKEN,
			apiReverseProxyUrl: 'https://bypass.churchless.tech/api/conversation',
		});
	}

	_queue = [];
	async sendMessage(message) {
		return new Promise((resolve, reject) => {
			this._queue.unshift({ resolve, reject, message });
			this._handleQueue();
		});
	}

	_isQueueWorkerRun = false;
	/**
	 * Handle queue to send messages to a ChatGPT with delay between messages
	 */
	async _handleQueue() {
		if (this._isQueueWorkerRun) return;

		this._isQueueWorkerRun = true;
		while (true) {
			if (this._queue.length === 0) break;

			const task = this._queue.pop();
			await this.api.sendMessage(task.message).then(task.resolve, task.reject);
			await new Promise((res) => setTimeout(res, this._delay));
		}

		this._isQueueWorkerRun = false;
	}
}

/**
 * Chat GPT utils to work with locales
 */
export class ChatGPTUtils extends ChatGPT {
	/**
	 * String lenght limit for translate per one request
	 * This limit are soft, it may ignored in some edge cases
	 */
	_softLengthLimit = 1000;

	async _translateJsonSlice(jsonSlice, from, to) {
		const stringifiedJSON = JSON.stringify(jsonSlice, null, '\n');
		const res = await this.sendMessage(
			`Translate this JSON below from ${from} to ${to} and send me back only JSON with no your comments:\n${stringifiedJSON}`,
		);

		console.log({ translatedSlice: res.text });
		return JSON.parse(res.text);
	}

	/**
	 * Method to translate JSON. It automatically split long objects to translate small parts and then join back
	 */
	async translateJson(json, from, to) {
		// Return the same object for empty data
		if (typeof json !== 'object') throw new TypeError('JSON must be object');
		if (Object.values(json).length === 0) return json;

		console.warn({ json });

		const jsonEntries = Object.entries(json);
		const translatedJson = {};

		let offset = 0;
		let slice = [];
		let sliceLen = 0;
		let forceTranslate = false;
		while (true) {
			const isEndOfData = offset >= jsonEntries.length;

			// Translate slice
			const isSliceNotEmpty = slice.length > 0;
			if (isSliceNotEmpty && (forceTranslate || isEndOfData)) {
				const jsonSlice = Object.fromEntries(slice);

				// Clear slice
				slice = [];
				sliceLen = 0;
				forceTranslate = false;

				const translatedSlice = await this._translateJsonSlice(
					jsonSlice,
					from,
					to,
				);
				Object.assign(translatedJson, translatedSlice);
			}

			// Stop loop
			if (isEndOfData) break;

			// Fill slice
			const part = jsonEntries[offset];
			const partLen = JSON.stringify(part).length;

			// TODO: split text and translate parts by reach hard limit, event for only one part in slice
			// Add part if slice are empty or if part fit in a limit
			const isPartFitToSlice = this._softLengthLimit > partLen + sliceLen;
			if (slice.length === 0 || isPartFitToSlice) {
				slice.push(part);
				sliceLen += partLen;
				offset++;
			}

			if (!isPartFitToSlice) {
				forceTranslate = true;
			}
		}

		return translatedJson;
	}
}
