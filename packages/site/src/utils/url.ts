export const buildPathGetter = (baseUrl: string) => (path: string) =>
	[baseUrl, path].join('/').replace(/\/{2,}/g, '/');
