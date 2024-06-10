import browser from 'webextension-polyfill';

import { BatchTranslator } from '../../../../thirdparty/bergamot/src/frontend/BatchTranslator';
import { detectLanguage, getMessage } from '../../language';
import { serialize, unserialize } from '../../serializer';

import { TranslatorBackingWithCache } from './TranslatorBackingWithCache';

class OffscreenWorker {
	private workerId: Promise<string>;
	constructor(url: string) {
		this.workerId = browser.runtime.sendMessage({
			action: 'offscreenWorker.create',
			data: { url },
		});

		this.workerId.then((id) => console.log('Response from worker', id));

		browser.runtime.onMessage.addListener((rawMessage) => {
			const message = unserialize(rawMessage);
			switch (message.action) {
				case 'offscreenWorkerClient.event': {
					console.log('EVENT offscreenWorkerClient.event', message);
					const listeners = this.listeners[message.data.name];
					if (!listeners) return;

					console.log('Listeners to notify: ', listeners);
					listeners.forEach((listener) =>
						listener({ data: message.data.data }),
					);

					return Promise.resolve();
				}
			}

			return;
		});
	}

	public postMessage(args: any) {
		console.warn('DBG: postMessage to virtual worker', args);
		this.workerId.then((workerId) => {
			browser.runtime.sendMessage(
				serialize({
					action: 'offscreenWorker.postMessage',
					data: { workerId, args },
				}),
			);
		});
	}

	private listeners: Record<string, Set<(...args: any[]) => any>> = {};
	public addEventListener(eventName: string, callback: () => any) {
		const listenersSet = this.listeners[eventName] ?? new Set();
		listenersSet.add(callback);

		this.listeners[eventName] = listenersSet;
	}
}

globalThis.Worker = OffscreenWorker as any;

export class BergamotTranslator {
	static translatorName = getMessage('common_offlineTranslator', 'Bergamot');
	static isRequiredKey = () => false;

	private translator;
	constructor() {
		const workerUrl = browser.runtime.getURL(
			'thirdparty/bergamot/translator.worker.js',
		);
		const backing = new TranslatorBackingWithCache({
			workerUrl,
			// This error handler do nothing, but it's required to `translate` method correct handle exceptions
			// With no error handler here we cannot to catch an error when worker does not exists
			onerror(err) {
				console.warn(
					'BergamotTranslator: error in TranslatorBackingWithCache',
					err,
				);
			},
		});
		this.translator = new BatchTranslator(backing, {
			onerror(err) {
				console.warn('BergamotTranslator: error in BatchTranslator', err);
			},
		});
	}

	translate = async (text: string, from: string, to: string) => {
		if (from === 'auto') {
			const langs = BergamotTranslator.getSupportedLanguages();
			const detectedLanguage = await detectLanguage(text);
			if (detectedLanguage !== null && langs.includes(detectedLanguage)) {
				from = detectedLanguage;
			} else {
				// Use most popular content language or first of list
				const defaultLang =
					to !== 'en' ? 'en' : langs.find((lang) => lang !== to);
				from = defaultLang ?? 'en';
			}
		}

		if (from === to) return text;

		const response = this.translator.translate({
			from,
			to,
			text,
			html: false,
			priority: 0,
		});

		return response.then((response) => response.target.text);
	};

	translateBatch = (texts: string[], from: string, to: string) =>
		Promise.all(texts.map((text) => this.translate(text, from, to)));

	getLengthLimit = () => 5000;
	getRequestsTimeout = () => 100;
	checkLimitExceeding = (text: string) => {
		const textLength = !Array.isArray(text)
			? text.length
			: text.reduce((len, text) => len + text.length, 0);

		return textLength - this.getLengthLimit();
	};

	static isSupportedAutoFrom = () => true;

	// prettier-ignore
	static getSupportedLanguages = () => [
		"fr", "en", "it", "pt", "ru", "cs",
		"de", "es", "et", "bg", "uk"
	];
}
