import { App } from './app';

if (
	location.href ===
	'chrome-extension://gegffcnldhjmdhjpjkbikccdnbdonnek/background.worker.js'
) {
	App.main();
} else {
	console.log('Prevented run worker code');
}
