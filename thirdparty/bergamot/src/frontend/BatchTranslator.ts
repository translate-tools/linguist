/**
 * This file imported from a bergamot project
 * Source: https://github.com/browsermt/bergamot-translator/blob/82c276a15c23a40bc7e21e8a1e0a289a6ce57017/wasm/module/worker/translator-worker.js
 */

import { BergamotTranslatorWorkerAPI } from '../worker/types';
import { TranslationModel } from '../types';

import { CancelledError } from './errors';

import { TranslatorBacking } from './TranslatorBacking';

type TranslationRequest = {
	from: string;
	to: string;
	text: string;
	html: boolean;
	priority?: number;
	qualityScores?: boolean;
};

type TranslationResponse = {
	request: TranslationRequest;
	target: { text: string };
};

type WorkerObject = {
	idle: boolean;
	controls?: {
		worker: Worker;
		exports: BergamotTranslatorWorkerAPI;
	};
};

type TranslationTask = {
	id: number;
	key: string;
	priority: number;
	models: TranslationModel[];
	requests: Array<{
		request: TranslationRequest;
		resolve: (response: TranslationResponse) => void;
		reject: (error: Error) => void;
	}>;
};

/**
 * Translator balancing between throughput and latency. Can use multiple worker
 * threads.
 */
export class BatchTranslator {
	private backing;

	/**
	 * List of active workers (and a flag to mark them idle or not)
	 */
	private workers: WorkerObject[];
	private workerLimit;

	/**
	 * List of batches we push() to & shift() from using `enqueue`.
	 */
	private queue: TranslationTask[];

	/**
	 * batch serial to help keep track of batches when debugging
	 */
	private batchSerial;

	/**
	 * Number of requests in a batch before it is ready to be translated in
	 * a single call. Bigger is better for throughput (better matrix packing)
	 * but worse for latency since you'll have to wait for the entire batch
	 * to be translated.
	 */
	private batchSize;

	private onerror;

	constructor(
		backing: TranslatorBacking,
		options?: {
			workers?: number;
			batchSize?: number;
			onerror?: (err: Error) => void;
		},
	) {
		this.backing = backing;

		this.workers = [];
		this.workerLimit = Math.max(options?.workers || 0, 1);

		this.queue = [];
		this.batchSerial = 0;
		this.batchSize = Math.max(options?.batchSize || 8, 1);

		this.onerror =
			options?.onerror ||
			((err) => console.error('WASM Translation Worker error:', err));
	}

	/**
	 * @example
	 * ```
	 * const {target: {text:string}} = await this.translate({
	 *   from: 'de',
	 *   to: 'en',
	 *   text: 'Hallo Welt!',
	 *   html: false, // optional
	 *   priority: 0 // optional, like `nice` lower numbers are translated first
	 * })
	 * ```
	 */
	public translate(request: TranslationRequest): Promise<TranslationResponse> {
		const { from, to } = request;

		return new Promise(async (resolve, reject) => {
			// Batching key: only requests with the same key can be batched
			// together. Think same translation model, same options.
			const key = JSON.stringify({ from, to });

			// (Fetching models first because if we would do it between looking
			// for a batch and making a new one, we end up with a race condition.)
			const models = await this.backing.getModels(request);

			// Put the request and its callbacks into a fitting batch
			this.enqueue({ key, models, request, resolve, reject });

			// Tell a worker to pick up the work at some point.
			this.notify();
		});
	}

	/**
	 * Internal function used to put a request in a batch that still has space.
	 * Also responsible for keeping the batches in order of priority. Called by
	 * `translate()` but also used when filtering pending requests.
	 */
	private enqueue({
		key,
		models,
		request,
		resolve,
		reject,
	}: {
		request: TranslationRequest;
		models: TranslationModel[];
		key: string;
		resolve: (rsp: TranslationResponse) => void;
		reject: (Error: Error) => void;
	}) {
		const priority = request.priority ?? 0;

		// Find a batch in the queue that we can add to
		// TODO: can we search backwards? that would speed things up
		let batch = this.queue.find((batch) => {
			return (
				batch.key === key &&
				batch.priority === priority &&
				batch.requests.length < this.batchSize
			);
		});

		// No batch or full batch? Queue up a new one
		if (!batch) {
			batch = { id: ++this.batchSerial, key, priority, models, requests: [] };

			this.queue.push(batch);
			this.queue.sort((a, b) => a.priority - b.priority);
		}

		batch.requests.push({ request, resolve, reject });
	}

	/**
	 * Makes sure queued work gets send to a worker. Will delay it till `idle`
	 * to make sure the batches have been filled to some degree. Will keep
	 * calling itself as long as there is work in the queue, but it does not
	 * hurt to call it multiple times. This function always returns immediately.
	 */
	private notify() {
		setTimeout(async () => {
			// Is there work to be done?
			if (!this.queue.length) return;

			// Find an idle worker
			let worker = this.workers.find((worker) => worker.idle);

			// No worker free, but space for more?
			if (!worker && this.workers.length < this.workerLimit) {
				let workerObject: WorkerObject | null = null;
				try {
					// Claim a place in the workers array (but mark it busy so
					// it doesn't get used by any other `notify()` calls).
					const placeholder: WorkerObject = { idle: false };
					this.workers.push(placeholder);
					workerObject = placeholder;

					// adds `worker` and `exports` props
					placeholder.controls = await this.backing.loadWorker();

					// At this point we know our new worker will be usable.
					worker = placeholder;
				} catch (e) {
					const wrappedError = new (Error as any)(
						`Could not initialise translation worker: ${
							(e as Error).message
						}`,
						{ cause: e },
					);

					this.onerror(wrappedError);

					// Remove worker from a pool
					if (workerObject !== null) {
						this.workers = this.workers.filter(
							(worker) => worker !== workerObject,
						);
					}

					// If no workers exists except current, probably we cannot load worker, so it is fatal error
					// For this case we reject all requests and clear queue
					if (this.workers.length <= 1) {
						this.queue.forEach((batch) => {
							batch.requests.forEach(({ reject }) => {
								reject(wrappedError);
							});
						});

						this.queue = [];
					}
				}
			}

			// If no worker, that's the end of it.
			if (!worker || !worker.controls) return;

			// Up to this point, this function has not used await, so no
			// chance that another call stole our batch since we did the check
			// at the beginning of this function and JavaScript is only
			// cooperatively parallel.
			const batch = this.queue.shift();

			// Put this worker to work, marking as busy
			worker.idle = false;
			if (batch) {
				try {
					await this.consumeBatch(batch, worker.controls.exports);
				} catch (e) {
					batch?.requests.forEach(({ reject }) => reject(e as Error));
				}
			}
			worker.idle = true;

			// Is there more work to be done? Do another idleRequest
			if (this.queue.length) this.notify();
		});
	}

	/**
	 * Internal method that uses a worker thread to process a batch. You can
	 * wait for the batch to be done by awaiting this call. You should only
	 * then reuse the worker otherwise you'll just clog up its message queue.
	 */
	private async consumeBatch(
		batch: TranslationTask,
		worker: BergamotTranslatorWorkerAPI,
	) {
		performance.mark('BergamotBatchTranslator.start');

		// Make sure the worker has all necessary models loaded. If not, tell it
		// first to load them.
		await Promise.all(
			batch.models.map(async ({ from, to }) => {
				if (!(await worker.hasTranslationModel({ from, to }))) {
					const buffers = await this.backing.getTranslationModel({ from, to });
					await worker.loadTranslationModel({ from, to }, buffers);
				}
			}),
		);

		// Call the worker to translate. Only sending the actually necessary
		// parts of the batch to avoid trying to send things that don't survive
		// the message passing API between this thread and the worker thread.
		const responses = await worker.translate({
			models: batch.models.map(({ from, to }) => ({ from, to })),
			texts: batch.requests.map(({ request: { text, html, qualityScores } }) => ({
				text: text.toString(),
				html: Boolean(html),
				qualityScores: Boolean(qualityScores),
			})),
		});

		// Responses are in! Connect them back to their requests and call their
		// callbacks.
		batch.requests.forEach(({ request, resolve }, i) => {
			// TODO: look at response.ok and reject() if it is false
			resolve({
				request, // Include request for easy reference? Will allow you
				// to specify custom properties and use that to link
				// request & response back to each other.
				...responses[i], // {target: {text: String}}
			});
		});

		performance.measure('BergamotBatchTranslator', 'BergamotBatchTranslator.start');
	}

	/**
	 * Destructor that stops and cleans up.
	 */
	public async delete() {
		// Empty the queue
		this.remove(() => true);

		// Terminate the workers
		this.workers.forEach(({ controls }) => {
			if (controls) {
				controls.worker.terminate();
			}
		});
	}

	/**
	 * Prune pending requests by testing each one of them to whether they're
	 * still relevant. Used to prune translation requests from tabs that got
	 * closed.
	 */
	public remove(filter: (request: TranslationRequest) => boolean) {
		const queue = this.queue;

		this.queue = [];

		queue.forEach((batch) => {
			batch.requests.forEach(({ request, resolve, reject }) => {
				if (filter(request)) {
					// Add error.request property to match response.request for
					// a resolve() callback. Pretty useful if you don't want to
					// do all kinds of Funcion.bind() dances.
					reject(
						Object.assign(new CancelledError('removed by filter'), {
							request,
						}),
					);
					return;
				}

				this.enqueue({
					key: batch.key,
					models: batch.models,
					request,
					resolve,
					reject,
				});
			});
		});
	}
}
