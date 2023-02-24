import { createEvent, createStore } from 'effector';
import browser from 'webextension-polyfill';

import { getPageTranslateState } from '../../requests/contentscript/pageTranslation/getPageTranslateState';
import { getTranslatorFeatures } from '../../requests/backend/getTranslatorFeatures';
import { getConfig } from '../../requests/backend/getConfig';
import { disableTranslatePage } from '../../requests/contentscript/pageTranslation/disableTranslatePage';
import { enableTranslatePage } from '../../requests/contentscript/pageTranslation/enableTranslatePage';

import { pageTranslatorStateUpdatedHandler } from '../ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';

type PageTranslationState = {
	tabId: null | number;
	isTranslating: boolean;
};

// TODO: add i18n texts
export class TranslatePageContextMenu {
	private menuItemId = 'translatePage';

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
			id: this.menuItemId,
			contexts: ['page'],
			title: 'Translate page',
			// type: 'checkbox',
			// checked: false,
		});

		browser.contextMenus.onClicked.addListener(this.onClickMenu);

		const updateMenuItem = async (tabId: number) => {
			const translateState = await getPageTranslateState(tabId);
			this.tabStateUpdated({
				tabId,
				isTranslating: translateState.isTranslated,
			});
		};

		const onActivated = (info: browser.Tabs.OnActivatedActiveInfoType) => {
			updateMenuItem(info.tabId);
		};
		browser.tabs.onActivated.addListener(onActivated);

		const onUpdated = (tabId: number) => {
			updateMenuItem(tabId);
		};
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
			browser.contextMenus.update(this.menuItemId, {
				title: state.isTranslating ? 'Disable translation' : 'Translate page',
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

		browser.contextMenus.remove(this.menuItemId);

		if (this.cleanupCallback !== null) {
			this.cleanupCallback();
		}
	}

	private onClickMenu = async (
		info: browser.Menus.OnClickData,
		tab: browser.Tabs.Tab | undefined,
	) => {
		if (info.menuItemId !== this.menuItemId) return;

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
