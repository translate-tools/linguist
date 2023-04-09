export type LanguagesDirection = { from: string; to: string };

export type TranslationModel = {
	from: string;
	to: string;
	files: Record<
		string,
		{
			name: string;
			size: number;
			expectedSha256Hash: string;
		}
	>;
};

export type ModelBuffers = {
	model: ArrayBuffer;
	shortlist: ArrayBuffer;
	vocabs: ArrayBuffer[];
	qualityModel: ArrayBuffer | null;
	config?: Record<string, string>;
};
