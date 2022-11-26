import browser, { Tabs } from 'webextension-polyfill';

export const getCurrentTab = () => {
	return browser.tabs
		.query({
			currentWindow: true,
			active: true,
		})
		.then((tab) => tab[0]);
};

export const getCurrentTabId = () =>
	getCurrentTab().then((tab) => {
		const tabId = tab.id;
		return tabId !== undefined ? tabId : Promise.reject(new Error('Invalid tab id'));
	});

export const getAllTabs = () =>
	browser.tabs
		.query({})
		.then(
			(tabs): (Tabs.Tab & { id: number })[] =>
				tabs.filter((tab) => tab.id !== undefined) as any,
		);
