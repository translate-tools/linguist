/* eslint-disable */

// TODO: introduce interfaces, use it to ensure contracts between workers
// TODO: improve types, remove any
// TODO: split file to modules

import browser from 'webextension-polyfill';

import { getBergamotFile } from '../../requests/backend/bergamot/getBergamotFile';
import { addBergamotFile } from '../../requests/backend/bergamot/addBergamotFile';
import {
	BergamotTranslatorWorkerAPI,
	ModelBuffers,
	TranslationModel,
} from '../../../thirdparty/bergamot/src/translator-worker';

/**
 * @typedef {Object} TranslationRequest
 * @property {String} from
 * @property {String} to
 * @property {String} text
 * @property {Boolean} html
 * @property {Integer?} priority
 */

/**
 * @typedef {Object} TranslationResponse
 * @property {TranslationRequest} request
 * @property {{text: string}} target
 */

/**
 * Thrown when a pending translation is replaced by another newer pending
 * translation.
 */
export class SupersededError extends Error {}

/**
 * Thrown when a translation was removed from the queue.
 */
export class CancelledError extends Error {}

const backingStorageName = 'bergamotBacking';

export type TranslationRequest = {
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

type LanguagesDirection = { from: string; to: string };

type Registry = TranslationModel[];

type BackingOptions = {
	cacheSize?: number;
	useNativeIntGemm?: boolean;
	downloadTimeout?: number;
	registryUrl?: string;
	pivotLanguage?: string;
	onerror?: (err: ErrorEvent) => void;
	workerUrl?: string;
};
/**
 * Wrapper around bergamot-translator loading and model management.
 */
export class TranslatorBacking {
	private registryUrl;
	private downloadTimeout;
	private registry;
	private buffers;
	private pivotLanguage;
	private models;
	private onerror;

	private options;
	constructor(options?: BackingOptions) {
		this.options = options || {};

		this.registryUrl =
			this.options.registryUrl ||
			'https://bergamot.s3.amazonaws.com/models/index.json';

		this.downloadTimeout = this.options.downloadTimeout ?? 60000;

		/**
		 * registry of all available models and their urls
		 * @type {Promise<Model[]>}
		 */
		this.registry = this.loadModelRegistery();

		/**
		 * Map of downloaded model data files as buffers per model.
		 * @type {Map<{from:string,to:string}, Promise<Map<string,ArrayBuffer>>>}
		 */
		this.buffers = new Map<string, Promise<ModelBuffers>>();

		/**
		 * @type {string?}
		 */
		this.pivotLanguage =
			'pivotLanguage' in this.options ? this.options.pivotLanguage : 'en';

		/**
		 * A map of language-pairs to a list of models you need for it.
		 * @type {Map<{from:string,to:string}, Promise<{from:string,to:string}[]>>}
		 */
		this.models = new Map<string, Promise<TranslationModel[]>>();

		/**
		 * Error handler for all errors that are async, not tied to a specific
		 * call and that are unrecoverable.
		 * @type {(error: Error)}
		 */
		this.onerror =
			this.options.onerror ||
			((err) => console.error('WASM Translation Worker error:', err));
	}

	/**
	 * Loads a worker thread, and wraps it in a message passing proxy. I.e. it
	 * exposes the entire interface of TranslationWorker here, and all calls
	 * to it are async. Do note that you can only pass arguments that survive
	 * being copied into a message.
	 * @return {Promise<{worker:Worker, exports:Proxy<TranslationWorker>}>}
	 */
	async loadWorker() {
		const worker = new Worker(
			this.options.workerUrl ??
				browser.runtime.getURL('thirdparty/bergamot/translator-worker.js'),
		);

		/**
		 * Incremental counter to derive request/response ids from.
		 */
		let serial = 0;

		/**
		 * Map of pending requests
		 * @type {Map<number,{accept:(any), reject:(Error)}>}
		 */
		const pending = new Map();

		// Function to send requests
		const call = (name: string | symbol, ...args: any[]) =>
			new Promise((accept, reject) => {
				const id = ++serial;
				pending.set(id, {
					accept,
					reject,
					callsite: {
						// for debugging which call caused the error
						message: `${String(name)}(${args
							.map((arg) => String(arg))
							.join(', ')})`,
						stack: new Error().stack,
					},
				});
				worker.postMessage({ id, name, args });
			});

		// … receive responses
		worker.addEventListener('message', function ({ data: { id, result, error } }) {
			if (!pending.has(id)) {
				console.debug('Received message with unknown id:', arguments[0]);
				throw new Error(
					`BergamotTranslator received response from worker to unknown call '${id}'`,
				);
			}

			const { accept, reject, callsite } = pending.get(id);
			pending.delete(id);

			if (error !== undefined)
				reject(
					Object.assign(new Error(), error, {
						message: error.message + ` (response to ${callsite.message})`,
						stack: error.stack
							? `${error.stack}\n${callsite.stack}`
							: callsite.stack,
					}),
				);
			else accept(result);
		});

		// … and general errors
		worker.addEventListener('error', this.onerror.bind(this));

		// Await initialisation. This will also nicely error out if the WASM
		// runtime fails to load.
		await call('initialize', this.options);

		/**
		 * Little wrapper around the message passing api of Worker to make it
		 * easy to await a response to a sent message. This wraps the worker in
		 * a Proxy so you can treat it as if it is an instance of the
		 * TranslationWorker class that lives inside the worker. All function
		 * calls to it are transparently passed through the message passing
		 * channel.
		 */
		return {
			worker,
			exports: new Proxy(
				{},
				{
					get(_target, name, _receiver) {
						// Prevent this object from being marked "then-able"
						if (name !== 'then')
							return (...args: any[]) => call(name, ...args);

						return undefined;
					},
				},
			) as BergamotTranslatorWorkerAPI,
		};
	}

	/**
	 * Loads the model registry. Uses the registry shipped with this extension,
	 * but formatted a bit easier to use, and future-proofed to be swapped out
	 * with a TranslateLocally type registry.
	 * @return {Promise<{
	 *   from: string,
	 *   to: string,
	 *   files: {
	 *     [part:string]: {
	 *       name: string,
	 *       size: number,
	 *       expectedSha256Hash: string
	 *     }
	 *   }[]
	 * }>}
	 */
	async loadModelRegistery(): Promise<Registry> {
		// TODO: return cache only when fetch failed
		const { [backingStorageName]: dataFromStorage } = await browser.storage.local.get(
			backingStorageName,
		);
		if (dataFromStorage) {
			console.warn('GOT FROM CACHE', dataFromStorage);
			return dataFromStorage;
		}

		const response = await fetch(this.registryUrl, { credentials: 'omit' });
		const registry = await response.json();

		// Add 'from' and 'to' keys for each model.
		const data = Array.from(Object.entries(registry), ([key, files]) => {
			return {
				from: key.substring(0, 2),
				to: key.substring(2, 4),

				// TODO: validate JSON
				files: files as Record<
					string,
					{
						name: string;
						size: number;
						expectedSha256Hash: string;
					}
				>,
			};
		});

		// Write data
		await browser.storage.local.set({ [backingStorageName]: data });

		return data;
	}

	/**
	 * Gets or loads translation model data. Caching wrapper around
	 * `loadTranslationModel()`.
	 * @param {{from:string, to:string}}
	 * @return {Promise<{
	 *   model: ArrayBuffer,
	 *   vocab: ArrayBuffer,
	 *   shortlist: ArrayBuffer,
	 *   qualityModel: ArrayBuffer?
	 * }>}
	 */
	getTranslationModel({ from, to }: LanguagesDirection): Promise<ModelBuffers> {
		const key = JSON.stringify({ from, to });

		if (!this.buffers.has(key)) {
			const promise = this.loadTranslationModel({ from, to });

			// set the promise so we return the same promise when its still pending
			this.buffers.set(key, promise);

			// But if loading fails, remove the promise again so we can try again later
			promise.catch((_err) => this.buffers.delete(key));
		}

		const modelPromise = this.buffers.get(key);
		if (modelPromise === undefined) {
			throw new Error('Translation model promise not found');
		}

		return modelPromise;
	}

	/**
	 * Downloads a translation model and returns a set of
	 * ArrayBuffers. These can then be passed to a TranslationWorker thread
	 * to instantiate a TranslationModel inside the WASM vm.
	 * @param {{from:string, to:string}}
	 * @param {{signal:AbortSignal?}?}
	 * @return {Promise<{
	 *   model: ArrayBuffer,
	 *   vocab: ArrayBuffer,
	 *   shortlist: ArrayBuffer,
	 *   qualityModel: ArrayBuffer?
	 *   config: string?
	 * }>}
	 */
	async loadTranslationModel({ from, to }: LanguagesDirection): Promise<ModelBuffers> {
		performance.mark(`loadTranslationModule.${JSON.stringify({ from, to })}`);

		// Find that model in the registry which will tell us about its files
		const entry = (await this.registry).find(
			(model) => model.from == from && model.to == to,
		);

		if (!entry) throw new Error(`No model for '${from}' -> '${to}'`);

		const files = entry.files;

		// Download all files mentioned in the registry entry
		const buffers = Object.fromEntries(
			await Promise.all(
				Object.entries(files).map(async ([part, file]) => {
					// Special case where qualityModel is not part of the model, and this
					// should also catch the `config` case.
					if (file === undefined || file.name === undefined)
						return [part, null] as const;

					try {
						// Try get from cache
						const cachedData = await getBergamotFile({
							type: part,
							expectedSha256Hash: file.expectedSha256Hash,
							direction: { from, to },
						});
						if (cachedData !== null) {
							return [part, cachedData.buffer] as const;
						}

						const start = performance.now();
						const arrayBuffer = await this.fetch(
							file.name,
							file.expectedSha256Hash,
						);
						console.warn(
							'TIME TO LOAD FILE FROM INTERNET',
							performance.now() - start,
						);

						// Write cache
						await addBergamotFile({
							name: file.name,
							expectedSha256Hash: file.expectedSha256Hash,

							type: part,
							direction: { from, to },
							buffer: arrayBuffer,
						});

						return [part, arrayBuffer] as const;
					} catch (cause) {
						throw new Error(
							`Could not fetch ${file.name} for ${from}->${to} model`,
						);
					}
				}),
			),
		);

		performance.measure(
			'loadTranslationModel',
			`loadTranslationModule.${JSON.stringify({ from, to })}`,
		);

		let vocabs: ArrayBuffer[];
		if (buffers.vocab) {
			vocabs = [buffers.vocab];
		} else if (buffers.trgvocab && buffers.srcvocab) {
			vocabs = [buffers.srcvocab, buffers.trgvocab];
		} else {
			throw new Error(
				`Could not identify vocab files for ${from}->${to} model among: ${Array.from(
					Object.keys(files),
				).join(' ')}`,
			);
		}

		let config: Record<string, any> = {};

		// For the Ukrainian models we need to override the gemm-precision
		if (files.model.name.endsWith('intgemm8.bin')) {
			config['gemm-precision'] = 'int8shiftAll';
		}

		// If quality estimation is used, we need to turn off skip-cost. Turning
		// this off causes quite the slowdown.
		if (files.qualityModel) {
			config['skip-cost'] = false;
		}

		// Allow the registry to also specify marian configuration parameters
		if (files.config) {
			Object.assign(config, files.config);
		}

		if (!buffers.model || !buffers.lex) {
			throw new Error();
		}

		// Translate to generic bergamot-translator format that also supports
		// separate vocabularies for input & output language, and calls 'lex'
		// a more descriptive 'shortlist'.
		return {
			model: buffers.model,
			shortlist: buffers.lex,
			vocabs,
			qualityModel: buffers.qualityModel ?? null,
			config,
		};
	}

	/**
	 * Helper to download file from the web. Verifies the checksum.
	 * @param {string} url
	 * @param {string?} checksum sha256 checksum as hexadecimal string
	 * @param {{signal:AbortSignal}?} extra fetch options
	 * @returns {Promise<ArrayBuffer>}
	 */
	async fetch(url: string, checksum: string) {
		// Rig up a timeout cancel signal for our fetch
		const controller = new AbortController();
		const abort = () => controller.abort();

		const timeout = this.downloadTimeout
			? setTimeout(abort, this.downloadTimeout)
			: null;

		try {
			const options: RequestInit = {
				credentials: 'omit',
				signal: controller.signal,
			};

			if (checksum) {
				options['integrity'] = `sha256-${this.hexToBase64(checksum)}`;
			}

			// Disable the integrity check for NodeJS because of
			// https://github.com/nodejs/undici/issues/1594
			if (typeof window === 'undefined') delete options['integrity'];

			// Start downloading the url, using the hex checksum to ask
			// `fetch` to verify the download using subresource integrity
			return fetch(url, options).then((rsp) => rsp.arrayBuffer());
		} finally {
			if (timeout) clearTimeout(timeout);
		}
	}

	/**
	 * Converts the hexadecimal hashes from the registry to something we can use with
	 * the fetch() method.
	 */
	hexToBase64(hexstring: string) {
		const match = hexstring.match(/\w{2}/g);
		if (match === null) {
			throw new TypeError('Hex string are invalid');
		}

		const binaryString = match
			.map((a) => String.fromCharCode(parseInt(a, 16)))
			.join('');
		return btoa(binaryString);
	}

	/**
	 * Crappy named method that gives you a list of models to translate from
	 * one language into the other. Generally this will be the same as you
	 * just put in if there is a direct model, but it could return a list of
	 * two models if you need to pivot through a third language.
	 * Returns just [{from:str,to:str}...]. To be used something like this:
	 * ```
	 * const models = await this.getModels(from, to);
	 * models.forEach(({from, to}) => {
	 *   const buffers = await this.loadTranslationModel({from,to});
	 *   [TranslationWorker].loadTranslationModel({from,to}, buffers)
	 * });
	 * ```
	 * @returns {Promise<TranslationModel[]>}
	 */
	getModels({ from, to }: LanguagesDirection) {
		const key = JSON.stringify({ from, to });

		// Note that the `this.models` map stores Promises. This so that
		// multiple calls to `getModels` that ask for the same model will
		// return the same promise, and the actual lookup is only done once.
		// The lookup is async because we need to await `this.registry`
		if (!this.models.has(key)) this.models.set(key, this.findModels(from, to));

		const model = this.models.get(key);
		if (!model) {
			throw new Error('Model not found');
		}

		return model;
	}

	/**
	 * Find model (or model pair) to translate from `from` to `to`.
	 * @param {string} from
	 * @param {string} to
	 * @returns {Promise<TranslationModel[]>}
	 */
	async findModels(from: string, to: string) {
		const registry = await this.registry;

		let direct: TranslationModel[] = [],
			outbound: TranslationModel[] = [],
			inbound: TranslationModel[] = [];

		registry.forEach((model) => {
			if (model.from === from && model.to === to) direct.push(model);
			else if (model.from === from && model.to === this.pivotLanguage)
				outbound.push(model);
			else if (model.to === to && model.from === this.pivotLanguage)
				inbound.push(model);
		});

		if (direct.length) return [direct[0]];

		if (outbound.length && inbound.length) return [outbound[0], inbound[0]];

		throw new Error(`No model available to translate from '${from}' to '${to}'`);
	}
}

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
		options?: Partial<
			BackingOptions & {
				workers: number;
				batchSize: number;
			}
		>,
		backing?: TranslatorBacking,
	) {
		this.backing = backing ?? new TranslatorBacking(options);

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
				try {
					// Claim a place in the workers array (but mark it busy so
					// it doesn't get used by any other `notify()` calls).
					const placeholder: WorkerObject = { idle: false };
					this.workers.push(placeholder);

					// adds `worker` and `exports` props
					placeholder.controls = await this.backing.loadWorker();

					// At this point we know our new worker will be usable.
					worker = placeholder;
				} catch (e) {
					this.onerror(
						new Error(
							`Could not initialise translation worker: ${
								(e as Error).message
							}`,
						) as unknown as ErrorEvent,
					);
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
