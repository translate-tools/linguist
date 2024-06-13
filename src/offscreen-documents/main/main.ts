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
	// We set `allow-same-origin` here, to let iframe use extension API for messaging, instead of message with parent with postMessage and just forward messages with extension api here.
	// This iframe contain only trusted code, so we should not have any problems
	workerIframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
	document.body.appendChild(workerIframe);
});
