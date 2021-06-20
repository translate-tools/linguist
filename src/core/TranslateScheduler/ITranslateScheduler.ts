import { langCodeWithAuto, langCode } from '../types/Translator';

export interface ITranslateOptions {
	/**
	 * Context for grouping requests
	 */
	context?: string;

	/**
	 * Use direct translate for this request if it possible
	 */
	directTranslate?: boolean;
}

export interface ITranslateScheduler {
	translate(
		text: string,
		from: langCodeWithAuto,
		to: langCode,
		options?: ITranslateOptions,
	): Promise<string>;
}
