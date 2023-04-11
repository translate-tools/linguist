/**
 * This file imported from a bergamot project
 * Source: https://github.com/browsermt/bergamot-translator/blob/82c276a15c23a40bc7e21e8a1e0a289a6ce57017/wasm/module/worker/translator-worker.js
 */

import { BergamotTranslatorWorker } from './BergamotTranslatorWorker';

/**
 * Because you can't put an Error object in a message. But you can post a
 * generic object!
 * @param {Error} error
 * @return {{
 *  name: string?,
 *  message: string?,
 *  stack: string?
 * }}
 */
function cloneError(error: Error): {
	name?: string;
	message?: string;
	stack?: string;
} {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
}

// (Constructor doesn't really do anything, we need to call `initialize()`
// first before using it. That happens from outside the worker.)
const worker = new BergamotTranslatorWorker();

self.addEventListener('message', async function(request) {
	const {
		data: { id, name, args },
	} = request;
	if (!id) console.error('Received message without id', request);

	try {
		if (typeof (worker as any)[name] !== 'function')
			throw TypeError(`worker[${name}] is not a function`);

		// Using `Promise.resolve` to await any promises that worker[name]
		// possibly returns.
		const result = await Promise.resolve(
			Reflect.apply((worker as any)[name], worker, args),
		);
		self.postMessage({ id, result });
	} catch (error) {
		self.postMessage({
			id,
			error: cloneError(error as Error),
		});
	}
});
