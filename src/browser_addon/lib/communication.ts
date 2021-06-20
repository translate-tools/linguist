import { browser, Runtime } from 'webextension-polyfill-ts';

type RequestHandler = (data: any, sender: Runtime.MessageSender) => void | Promise<any>;

export function addRequestHandler(action: string, handler: RequestHandler) {
	const wrapper = (message: any, sender: Runtime.MessageSender) => {
		if (!(message instanceof Object) || message.action !== action) return;

		return handler(message.data, sender);
	};

	browser.runtime.onMessage.addListener(wrapper);

	const cleanup = () => browser.runtime.onMessage.removeListener(wrapper);
	return cleanup;
}

export function bgSendRequest(action: string, data?: any) {
	return browser.runtime.sendMessage({ action, data });
}

export function csSendRequest(tabId: number, action: string, data?: any) {
	return browser.tabs.sendMessage(tabId, { action, data });
}

export const getCurrentTab = () => {
	return browser.tabs
		.query({
			currentWindow: true,
			active: true,
		})
		.then((tab) => {
			return tab[0];
		});
};

export const sendRequestToAllCS = (action: string, data?: any) =>
	browser.tabs
		.query({})
		.then((tabs) =>
			Promise.all(
				tabs.map((tab) =>
					tab.id !== undefined
						? csSendRequest(tab.id, action, data)
						: undefined,
				),
			),
		);

export const getCurrentTabId = () =>
	getCurrentTab().then((tab) => {
		const tabId = tab.id;
		return tabId !== undefined ? tabId : Promise.reject(new Error('Invalid tab id'));
	});

export const pingSomething = (
	callback: () => Promise<any>,
	timeout?: number,
): Promise<void> => {
	const startTime = new Date().getTime();

	return new Promise(async (resolve, reject) => {
		let breakFlag = false;
		while (!breakFlag) {
			await callback()
				.then((response) => {
					if (response === 'pong') {
						resolve();
						breakFlag = true;
					} else {
						throw new Error('Incorrect ping response');
					}
				})
				.catch(() => {
					if (
						timeout !== undefined &&
						new Date().getTime() - startTime >= timeout
					) {
						reject(new Error('Timeout'));
						breakFlag = true;
					}
				});
		}
	});
};
