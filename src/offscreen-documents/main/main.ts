/**
 * Since we may use only one offscreen document, this is a root document,
 * that include another ones as iframes
 */

import { customTranslatorsFactory } from '../../requests/offscreen/customTranslators';

// TODO: add types validation between all requests
document.addEventListener('DOMContentLoaded', async () => {
	console.log('Main is run');
	customTranslatorsFactory();

	const workerIframe = document.createElement('iframe', {});
	workerIframe.src = '/offscreen-documents/worker/worker.html';
	workerIframe.setAttribute('sandbox', 'allow-scripts');
	document.body.appendChild(workerIframe);
});
