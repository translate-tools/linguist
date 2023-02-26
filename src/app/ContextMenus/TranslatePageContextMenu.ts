import { createEvent, createStore } from 'effector';
import browser from 'webextension-polyfill';

import { getMessage } from '../../lib/language';
import { getCurrentTab } from '../../lib/browser/tabs';

import { getTranslatorFeatures } from '../../requests/backend/getTranslatorFeatures';
import { getConfig } from '../../requests/backend/getConfig';
import { getPageTranslateState } from '../../requests/contentscript/pageTranslation/getPageTranslateState';
import { disableTranslatePage } from '../../requests/contentscript/pageTranslation/disableTranslatePage';
import { enableTranslatePage } from '../../requests/contentscript/pageTranslation/enableTranslatePage';

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
		});

		browser.contextMenus.onClicked.addListener(this.onClickMenu);
		browser.tabs.onActivated.addListener(this.updateMenuItem);
		browser.tabs.onUpdated.addListener(this.updateMenuItem);

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
			browser.tabs.onActivated.removeListener(this.updateMenuItem);
			browser.tabs.onUpdated.removeListener(this.updateMenuItem);

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

	private updateMenuItem = async () => {
		const tab = await getCurrentTab();

		let isVisible = false;
		if (tab.url !== undefined) {
			const tabUrl = new URL(tab.url);
			const isUrlHasHttpProtocol = tabUrl.protocol.startsWith('http');
			isVisible = isUrlHasHttpProtocol;
		}

		browser.contextMenus.update(this.menuId, {
			visible: isVisible,
		});

		if (isVisible) {
			const tabId = tab.id;
			if (tabId === undefined) return;

			const translateState = await getPageTranslateState(tabId);
			this.tabStateUpdated({
				tabId,
				isTranslating: translateState.isTranslated,
			});
		}
	};

	private onClickMenu = async (
		info: browser.Menus.OnClickData,
		tab: browser.Tabs.Tab | undefined,
	) => {
		if (info.menuItemId !== this.menuId) return;

		const tabId = tab?.id;
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
