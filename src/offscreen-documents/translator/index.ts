export type TranslatorWorkerApi = {
	init(code: string): void;
	translate(text: string, from: string, to: string): string;
	translateBatch(texts: string[], from: string, to: string): string[];
};
