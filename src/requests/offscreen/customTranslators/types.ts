export type CustomTranslatorsParentFrameApi = {
	fetch(
		url: string,
		options: RequestInit,
	): {
		body: Blob;
		status: number;
		statusText: string;
		headers: Record<string, string>;
	};
};
