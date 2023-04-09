import { ModelBuffers } from '../types';

export type BergamotTranslatorWorkerOptions = {
	cacheSize?: number;
	useNativeIntGemm?: boolean;
};

/**
 * Interface of translator instance
 */
export type IBergamotTranslatorWorker = {
	initialize: (options?: BergamotTranslatorWorkerOptions) => Promise<void>;
	hasTranslationModel: (model: { from: string; to: string }) => boolean;
	loadTranslationModel: (
		model: { from: string; to: string },
		buffers: ModelBuffers,
	) => void;
	translate: (request: {
		models: { from: string; to: string }[];
		texts: { text: string; html: boolean; qualityScores?: boolean }[];
	}) => { target: { text: string } }[];
};

/**
 * Worker API used with async messages, so any method call are async
 */
export type BergamotTranslatorWorkerAPI = {
	[K in keyof IBergamotTranslatorWorker]: IBergamotTranslatorWorker[K] extends (
		...args: infer Args
	) => infer Result
		? (...args: Args) => Promise<Result>
		: never;
};
