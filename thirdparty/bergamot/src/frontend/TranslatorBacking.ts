/**
 * This file imported from a bergamot project
 * Source: https://github.com/browsermt/bergamot-translator/blob/82c276a15c23a40bc7e21e8a1e0a289a6ce57017/wasm/module/worker/translator-worker.js
 */

import {
	BergamotTranslatorWorkerAPI,
	BergamotTranslatorWorkerOptions,
} from '../worker/types';

import {
	LanguagesDirection,
	ModelBuffers,
	ModelConfig,
	TranslationModel,
	TranslationModelFileReference,
} from '../types';

type Registry = TranslationModel[];

export type BackingOptions = BergamotTranslatorWorkerOptions & {
	workerUrl: string;
	registryUrl?: string;
	downloadTimeout?: number;
	pivotLanguage?: string;
	onerror?: (err: ErrorEvent) => void;
};

/**
 * Wrapper around bergamot-translator loading and model management.
 */
export class TranslatorBacking {
	private registryUrl;
	private workerUrl;
	private downloadTimeout;
	private registry;
	private buffers;
	private pivotLanguage;
	private models;
	private onerror;

	private options;
	constructor({ workerUrl, registryUrl, onerror, ...options }: BackingOptions) {
		this.options = options;

		this.registryUrl =
			registryUrl || 'https://bergamot.s3.amazonaws.com/models/index.json';

		this.workerUrl = workerUrl;

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
			onerror || ((err) => console.error('WASM Translation Worker error:', err));
	}

	protected createWorker = (url: string) => {
		return new Worker(url);
	}

	/**
	 * Loads a worker thread, and wraps it in a message passing proxy. I.e. it
	 * exposes the entire interface of TranslationWorker here, and all calls
	 * to it are async. Do note that you can only pass arguments that survive
	 * being copied into a message.
	 * @return {Promise<{worker:Worker, exports:Proxy<TranslationWorker>}>}
	 */
	async loadWorker() {
		const worker = this.createWorker(this.workerUrl);

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
		const response = await fetch(this.registryUrl, { credentials: 'omit' });
		const registry = await response.json();

		// Add 'from' and 'to' keys for each model.
		return Array.from(Object.entries(registry), ([key, files]) => {
			return {
				from: key.substring(0, 2),
				to: key.substring(2, 4),

				// TODO: validate JSON
				files: files as Record<string, TranslationModelFileReference>,
			};
		});
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

	async getModelFile(
		part: string,
		file: TranslationModelFileReference,
		direction: LanguagesDirection,
	) {
		// Special case where qualityModel is not part of the model, and this
		// should also catch the `config` case.
		if (file === undefined || file.name === undefined) return [part, null] as const;

		try {
			const arrayBuffer = await this.fetch(file.name, file.expectedSha256Hash);
			return [part, arrayBuffer] as const;
		} catch (cause) {
			throw new Error(
				`Could not fetch ${file.name} for ${direction.from}->${direction.to} model`,
			);
		}
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
					return this.getModelFile(part, file, { from, to });
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

		const config: ModelConfig = {};

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

		const direct: TranslationModel[] = [],
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
