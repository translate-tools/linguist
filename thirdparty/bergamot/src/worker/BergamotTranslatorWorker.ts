/**
 * Wrapper around the dirty bits of Bergamot's WASM bindings.
 *
 * This file imported from a bergamot project
 * Source: https://github.com/browsermt/bergamot-translator/blob/82c276a15c23a40bc7e21e8a1e0a289a6ce57017/wasm/module/worker/translator-worker.js
 */

import { LanguagesDirection, ModelBuffers, TranslationModel } from '../types';
import { YAML } from './utils/YAML';
import { IBergamotTranslatorWorker, BergamotTranslatorWorkerOptions } from './types';

declare global {
	/**
	 * Docs: https://github.com/emscripten-core/emscripten/blob/9fdc94ad3e3c89558fd251048e8ae2c2ca408dc1/site/source/docs/api_reference/module.rst
	 */
	// eslint-disable-next-line no-var
	var Module: Record<string, Function>;

	/**
	 * Synchronous import
	 * Docs: https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
	 */
	// eslint-disable-next-line no-var
	var importScripts: (...files: string[]) => void;
}

// TODO: add actual type with onRuntimeInitialized, instantiateWasm, asm...
// Read more: https://github.com/emscripten-core/emscripten/blob/9fdc94ad3e3c89558fd251048e8ae2c2ca408dc1/site/source/docs/api_reference/module.rst
// Global because importScripts is global.
const Module: Record<string, any> = {};

type BlankedType<T, N> = T & { __tag: N };

// Blanked unknown types, to ensure we use expected types, even if don't know its content
type BergamotTranslator = BlankedType<Record<string, any>, 'BergamotTranslator'>;
type BlockingService = BlankedType<Record<string, any>, 'BlockingService'>;
type AlignedMemory = BlankedType<Record<string, any>, 'AlignedMemory'>;

/**
 * Wrapper around the bergamot-translator exported module that hides the need
 * of working with C++ style data structures and does model management.
 */
export class BergamotTranslatorWorker implements IBergamotTranslatorWorker {
	/**
	 * Map of expected symbol -> name of fallback symbol for functions that can
	 * be swizzled for a faster implementation. Firefox Nightly makes use of
	 * this.
	 */
	static readonly GEMM_TO_FALLBACK_FUNCTIONS_MAP = {
		/* eslint-disable camelcase */
		int8_prepare_a: 'int8PrepareAFallback',
		int8_prepare_b: 'int8PrepareBFallback',
		int8_prepare_b_from_transposed: 'int8PrepareBFromTransposedFallback',
		int8_prepare_b_from_quantized_transposed:
			'int8PrepareBFromQuantizedTransposedFallback',
		int8_prepare_bias: 'int8PrepareBiasFallback',
		int8_multiply_and_add_bias: 'int8MultiplyAndAddBiasFallback',
		int8_select_columns_of_b: 'int8SelectColumnsOfBFallback',
		/* eslint-enable camelcase */
	} as const;

	/**
	 * Name of module exported by Firefox Nightly that exports an optimised
	 * implementation of the symbols mentioned above.
	 */
	static readonly NATIVE_INT_GEMM = 'mozIntGemm';

	private options: BergamotTranslatorWorkerOptions = {};
	private models = new Map<string, Promise<TranslationModel>>();

	// @ts-ignore lazy initializing in method `initialize`
	private module: BergamotTranslator;

	// @ts-ignore lazy initializing in method `initialize`
	private service: BlockingService;

	/**
	 * Empty because we can't do async constructors yet. It is the
	 * responsibility of whoever owns this WebWorker to call `initialize()`.
	 */
	constructor() {}

	/**
	 * Instantiates a new translation worker with optional options object.
	 * If this call succeeds, the WASM runtime is loaded and ready.
	 *
	 * Available options are:
	 *   useNativeIntGemm: {true | false} defaults to false. If true, it will
	 *                     attempt to link to the intgemm module available in
	 *                     Firefox Nightly which makes translations much faster.
	 *          cacheSize: {Number} defaults to 0 which disables translation
	 *                     cache entirely. Note that this is a theoretical
	 *                     upper bound. In practice it will use about 1/3th of
	 *                     the cache specified here. 2^14 is not a bad starting
	 *                     value.
	 */
	public async initialize(options?: BergamotTranslatorWorkerOptions) {
		this.options = options || {};
		this.models = new Map();
		this.module = await this.loadModule();
		this.service = await this.loadTranslationService();
	}

	/**
	 * Tries to load native IntGEMM module for bergamot-translator. If that
	 * fails because it or any of the expected functions is not available, it
	 * falls back to using the naive implementations that come with the wasm
	 * binary itself through `linkFallbackIntGemm()`.
	 */
	protected linkNativeIntGemm(info: {
		env: { memory: WebAssembly.Memory };
	}): WebAssembly.Exports {
		const mozIntGemm = WebAssembly['mozIntGemm' as keyof typeof WebAssembly] as
			| (() => WebAssembly.Module)
			| undefined;
		if (!mozIntGemm) {
			console.warn(
				'Native gemm requested but not available, falling back to embedded gemm',
			);
			return this.linkFallbackIntGemm(info);
		}

		const instance = new WebAssembly.Instance(mozIntGemm(), {
			'': { memory: info['env']['memory'] },
		});

		if (
			!Array.from(
				Object.keys(BergamotTranslatorWorker.GEMM_TO_FALLBACK_FUNCTIONS_MAP),
			).every((fun) => instance.exports[fun])
		) {
			console.warn(
				'Native gemm is missing expected functions, falling back to embedded gemm',
			);
			return this.linkFallbackIntGemm(info);
		}

		return instance.exports;
	}

	/**
	 * Links intgemm functions that are already available in the wasm binary,
	 * but just exports them under the name that is expected by
	 * bergamot-translator.
	 */
	protected linkFallbackIntGemm(_info: {
		env: { memory: WebAssembly.Memory };
	}): WebAssembly.Exports {
		const mapping = Object.entries(
			BergamotTranslatorWorker.GEMM_TO_FALLBACK_FUNCTIONS_MAP,
		).map(([key, name]) => {
			return [key, (...args: any[]) => Module['asm'][name](...args)];
		});

		return Object.fromEntries(mapping);
	}

	/**
	 * Internal method. Reads and instantiates the WASM binary. Returns a
	 * promise for the exported Module object that contains all the classes
	 * and functions exported by bergamot-translator.
	 * @return {Promise<BergamotTranslator>}
	 */
	protected loadModule(): Promise<BergamotTranslator> {
		return new Promise<BergamotTranslator>(async (resolve, reject) => {
			try {
				const response = await self.fetch(
					new URL(
						'./bergamot-translator-worker.wasm',
						self.location.toString(),
					),
				);

				Object.assign(Module, {
					instantiateWasm: (
						info: WebAssembly.Imports,
						accept: (instance: WebAssembly.Instance) => any,
					) => {
						try {
							WebAssembly.instantiateStreaming(response, {
								...info,
								/* eslint-disable-next-line camelcase */
								wasm_gemm: this.options.useNativeIntGemm
									? this.linkNativeIntGemm(info as any)
									: this.linkFallbackIntGemm(info as any),
							})
								.then(({ instance }) => accept(instance))
								.catch(reject);
						} catch (err) {
							reject(err);
						}
						return {};
					},
					onRuntimeInitialized: () => {
						console.warn('MODULE INITIALIZED', Module);
						resolve(Module as BergamotTranslator);
					},
				});

				// Emscripten glue code. Webpack et al. should not mangle the `Module` property name!
				self.Module = Module;
				self.importScripts('bergamot-translator-worker.js');
			} catch (err) {
				reject(err);
			}
		});
	}

	/**
	 * Internal method. Instantiates a BlockingService()
	 * @return {BergamotTranslator.BlockingService}
	 */
	protected loadTranslationService(): BlockingService {
		return new this.module.BlockingService({
			cacheSize: Math.max(this.options.cacheSize || 0, 0),
		});
	}

	/**
	 * Returns whether a model has already been loaded in this worker. Marked
	 * async because the message passing interface we use expects async methods.
	 * @param {{from:string, to:string}}
	 * @return boolean
	 */
	public hasTranslationModel({ from, to }: LanguagesDirection) {
		const key = JSON.stringify({ from, to });
		return this.models.has(key);
	}

	/**
	 * Loads a translation model from a set of file buffers. After this, the
	 * model is available to translate with and `hasTranslationModel()` will
	 * return true for this pair.
	 * @param {{from:string, to:string}}
	 * @param {{
	 *   model: ArrayBuffer,
	 *   shortlist: ArrayBuffer,
	 *   vocabs: ArrayBuffer[],
	 *   qualityModel: ArrayBuffer?,
	 *   config?: {
	 *     [key:string]: string
	 *   }
	 * }} buffers
	 */
	public loadTranslationModel({ from, to }: LanguagesDirection, buffers: ModelBuffers) {
		// This because service_bindings.cpp:prepareVocabsSmartMemories :(
		const uniqueVocabs = buffers.vocabs.filter((vocab, index, vocabs) => {
			return !vocabs.slice(0, index).includes(vocab);
		});

		const [modelMemory, shortlistMemory, qualityModel, ...vocabMemory] = [
			this.prepareAlignedMemoryFromBuffer(buffers.model, 256),
			this.prepareAlignedMemoryFromBuffer(buffers.shortlist, 64),
			buffers.qualityModel // optional quality model
				? this.prepareAlignedMemoryFromBuffer(buffers.qualityModel, 64)
				: null,
			...uniqueVocabs.map((vocab) =>
				this.prepareAlignedMemoryFromBuffer(vocab, 64),
			),
		];

		const vocabs = new this.module.AlignedMemoryList();
		vocabMemory.forEach((vocab) => vocabs.push_back(vocab));

		// Defaults
		const modelConfig = YAML.parse(`
            beam-size: 1
            normalize: 1.0
            word-penalty: 0
            cpu-threads: 0
            gemm-precision: int8shiftAlphaAll
            skip-cost: true
        `);

		if (buffers.config) Object.assign(modelConfig, buffers.config);

		// WASM marian is only compiled with support for shiftedAll.
		if (modelConfig['gemm-precision'] === 'int8')
			modelConfig['gemm-precision'] = 'int8shiftAll';

		// Override these
		Object.assign(
			modelConfig,
			YAML.parse(`
            alignment: soft
            quiet: true
            quiet-translation: true
            max-length-break: 128
            mini-batch-words: 1024
            workspace: 128
            max-length-factor: 2.0
        `),
		);

		const key = JSON.stringify({ from, to });
		this.models.set(
			key,
			new this.module.TranslationModel(
				YAML.stringify(modelConfig),
				modelMemory,
				shortlistMemory,
				vocabs,
				qualityModel,
			),
		);
	}

	/**
	 * Frees up memory used by old translation model. Does nothing if model is
	 * already deleted.
	 * @param {{from:string, to:string}}
	 */
	public freeTranslationModel({ from, to }: LanguagesDirection) {
		const key = JSON.stringify({ from, to });

		if (!this.models.has(key)) return;

		const model = this.models.get(key);
		this.models.delete(key);

		if (model) {
			// TODO: review the type
			(model as any).delete();
		}
	}

	/**
	 * Internal function. Copies the data from an ArrayBuffer into memory that
	 * can be used inside the WASM vm by Marian.
	 * @param {{ArrayBuffer}} buffer
	 * @param {number} alignmentSize
	 * @return {BergamotTranslator.AlignedMemory}
	 */
	protected prepareAlignedMemoryFromBuffer(
		buffer: ArrayBuffer,
		alignmentSize: number,
	): AlignedMemory {
		const bytes = new Int8Array(buffer);
		const memory = new this.module.AlignedMemory(bytes.byteLength, alignmentSize);
		memory.getByteArrayView().set(bytes);
		return memory;
	}

	/**
	 * Public. Does actual translation work. You have to make sure that the
	 * models necessary for translating text are already loaded before calling
	 * this method. Returns a promise with translation responses.
	 * @param {{models: {from:string, to:string}[], texts: {text: string, html: boolean}[]}}
	 * @return {Promise<{target: {text: string}}[]>}
	 */
	public translate({
		models,
		texts,
	}: {
		models: LanguagesDirection[];
		texts: { text: string; html: boolean; qualityScores?: boolean }[];
	}): { target: { text: string } }[] {
		// Convert texts array into a std::vector<std::string>.
		const input = new this.module.VectorString();
		texts.forEach(({ text }) => input.push_back(text));

		// Extracts the texts[].html options into ResponseOption objects
		const options = new this.module.VectorResponseOptions();
		texts.forEach(({ html, qualityScores }) =>
			options.push_back({ alignment: false, html, qualityScores }),
		);

		// Turn our model names into a list of TranslationModel pointers
		const translationModels = models.map(({ from, to }) => {
			const key = JSON.stringify({ from, to });
			return this.models.get(key);
		});

		// translate the input, which is a vector<String>; the result is a vector<Response>
		const responses =
			models.length > 1
				? this.service.translateViaPivoting(...translationModels, input, options)
				: this.service.translate(...translationModels, input, options);

		input.delete();
		options.delete();

		// Convert the Response WASM wrappers into native JavaScript types we
		// can send over the 'wire' (message passing) in the same format as we
		// use in bergamot-translator.
		const translations = texts.map((_, i) => ({
			target: {
				text: responses.get(i).getTranslatedText(),
			},
		}));

		responses.delete();

		return translations;
	}
}
