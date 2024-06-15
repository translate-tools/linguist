export type CustomTranslatorInfo = {
	autoFrom: boolean;
	maxTextLength: number;
	timeout: number;
	supportedLanguages: string[];
};

export type TranslatorWorkerApi = {
	init(code: string): CustomTranslatorInfo;
	translate(text: string, from: string, to: string): string;
	translateBatch(texts: string[], from: string, to: string): string[];
};
