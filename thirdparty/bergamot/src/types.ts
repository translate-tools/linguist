export type LanguagesDirection = { from: string; to: string };

export type TranslationModelFileReference = {
	/**
	 * Actual content is a URL to a file
	 */
	name: string;
	/**
	 * Size in bytes
	 */
	size: number;
	/**
	 * Content hash
	 */
	expectedSha256Hash: string;
};

export type TranslationModel = {
	from: string;
	to: string;
	files: Record<string, TranslationModelFileReference>;
};

export type ModelConfig = Record<string, string | boolean>;

export type ModelBuffers = {
	model: ArrayBuffer;
	shortlist: ArrayBuffer;
	vocabs: ArrayBuffer[];
	qualityModel: ArrayBuffer | null;
	config?: ModelConfig;
};
