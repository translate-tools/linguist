export type PromiseWithControls<T = void> = {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
};
/** * Create promise that may be resolved/rejected outside */
export const createPromiseWithControls = <T = void>() => {
	const result = {} as PromiseWithControls<T>;
	result.promise = new Promise<T>((resolve, reject) => {
		result.resolve = resolve;
		result.reject = reject;
	});
	return result;
};
