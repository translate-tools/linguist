/**
 * Since we may use only one offscreen document, this is a root document,
 * that include another ones as iframes
 */

import { customTranslatorsFactory } from '../../requests/offscreen/customTranslators';

// TODO: add types validation between all requests

export const runTranslatorsSandbox = () => {
	console.log('runTranslatorsSandbox is in run');

	customTranslatorsFactory();
};
// document.addEventListener('DOMContentLoaded', async () => {
// 	console.log('Main is run');
// 	// const iframe1 = document.createElement('iframe', {});
// 	// iframe1.src = '/offscreen-documents/worker/worker.html';
// 	// iframe1.setAttribute(
// 	// 	'sandbox',
// 	// 	'allow-same-origin allow-scripts allow-popups allow-forms',
// 	// );
// 	// document.body.appendChild(iframe1);

// });
