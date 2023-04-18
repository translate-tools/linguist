import { createEvent, createStore } from 'effector';
import browser from 'webextension-polyfill';

import { isFirefox } from '../../lib/browser';
import { getCurrentTabId, isValidBrowserTabId } from '../../lib/browser/tabs';
import { getMessage } from '../../lib/language';
import { getConfig } from '../../requests/backend/getConfig';
import { getTranslatorFeatures } from '../../requests/backend/getTranslatorFeatures';
import { disableTranslatePage } from '../../requests/contentscript/pageTranslation/disableTranslatePage';
import { enableTranslatePage } from '../../requests/contentscript/pageTranslation/enableTranslatePage';
import { getPageTranslateState } from '../../requests/contentscript/pageTranslation/getPageTranslateState';

import { pageTranslatorStateUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';

type PageTranslationState = {
	tabId: null | number;
	isTranslating: boolean;
};

export class TranslatePageContextMenu {
	private menuId = 'translatePage';

	private tabStateUpdated;
	private $tabState;

	constructor() {
		this.tabStateUpdated = createEvent<PageTranslationState>();
		this.$tabState = createStore<PageTranslationState>({
			tabId: null,
			isTranslating: false,
		});

		this.$tabState.on(this.tabStateUpdated, (_state, payload) => payload);
	}

	private isEnabled = false;
	private cleanupCallback: null | (() => void) = null;
	public enable() {
		if (this.isEnabled) return;
		this.isEnabled = true;

		browser.contextMenus.create({
			id: this.menuId,
			contexts: ['page'],
			title: getMessage('contextMenu_translatePage'),
			...(isFirefox() ? { viewTypes: ['tab'] } : {}),
		});

		browser.contextMenus.onClicked.addListener(this.onClickMenu);

		const onActivated = ({ tabId }: browser.Tabs.OnActivatedActiveInfoType) =>
			this.updateMenuItem(tabId);
		browser.tabs.onActivated.addListener(onActivated);

		const onUpdated = (tabId: number) => this.updateMenuItem(tabId);
		browser.tabs.onUpdated.addListener(onUpdated);

		const unwatchPageTranslatorUpdated = pageTranslatorStateUpdatedHandler(
			(state, tabId) => {
				if (tabId === undefined || tabId !== this.$tabState.getState().tabId)
					return;

				this.tabStateUpdated({
					tabId,
					isTranslating: state.isTranslated,
				});
			},
		);

		const unwatchMenuItemState = this.$tabState.watch((state) => {
			browser.contextMenus.update(this.menuId, {
				title: state.isTranslating
					? getMessage('contextMenu_disablePageTranslation')
					: getMessage('contextMenu_translatePage'),
			});
		});

		this.cleanupCallback = () => {
			browser.contextMenus.onClicked.removeListener(this.onClickMenu);
			browser.tabs.onActivated.removeListener(onActivated);
			browser.tabs.onUpdated.removeListener(onUpdated);

			unwatchPageTranslatorUpdated();
			unwatchMenuItemState();
		};
	}

	public disable() {
		if (!this.isEnabled) return;
		this.isEnabled = false;

		browser.contextMenus.remove(this.menuId);

		if (this.cleanupCallback !== null) {
			this.cleanupCallback();
		}
	}

	private updateMenuItem = async (tabId: number) => {
		const currentWindow = await browser.windows.getCurrent();
		const tab = await browser.tabs.get(tabId);

		// Ignore menus from not current page context
		if (
			!tab.active ||
			!isValidBrowserTabId(tabId) ||
			!tab.windowId ||
			!currentWindow.id ||
			tab.windowId !== currentWindow.id
		)
			return;

		let isVisible = false;
		// url may be `undefined` or empty string (for chromium), we have to ignore both
		if (tab.url) {
			const tabUrl = new URL(tab.url);
			const isUrlHasHttpProtocol = tabUrl.protocol.startsWith('http');
			isVisible = isUrlHasHttpProtocol;
		}

		browser.contextMenus.update(this.menuId, {
			visible: isVisible,
		});

		if (isVisible) {
			try {
				const translateState = await getPageTranslateState(tabId);
				this.tabStateUpdated({
					tabId,
					isTranslating: translateState.isTranslated,
				});
			} catch (error) {
				// Handle case when tab contentscript is not loaded yet
				// and requests do not handle
				browser.contextMenus.update(this.menuId, {
					visible: false,
				});
			}
		}
	};

	private onClickMenu = async (
		info: browser.Menus.OnClickData,
		tab: browser.Tabs.Tab | undefined,
	) => {
		if (info.menuItemId !== this.menuId) return;

		let tabId = tab?.id;

		// Get current tab id if click on non browser tab
		// It is special case for chromium browsers, that does not support `viewTypes` feature #224
		if (tabId === browser.tabs.TAB_ID_NONE) {
			tabId = await getCurrentTabId();
		}

		if (tabId === undefined) return;

		const isTranslating = this.$tabState.getState().isTranslating;

		// Disable translating
		if (isTranslating) {
			disableTranslatePage(tabId);
			return;
		}

		// Translate page
		const config = await getConfig();
		const translateState = await getPageTranslateState(tabId);

		let from = translateState.translateDirection?.from ?? null;
		if (from === null) {
			const translatorFeatures = await getTranslatorFeatures();
			from = translatorFeatures.isSupportAutodetect
				? 'auto'
				: translatorFeatures.supportedLanguages[0];
		}

		const to = translateState.translateDirection?.to ?? config.language;
		enableTranslatePage(tabId, from, to);
	};
}
