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
// TODO: add method `disable`
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

	public enable() {
		browser.contextMenus.create({
			id: this.menuItemId,
			contexts: ['page'],
			title: 'Translate page',
			// type: 'checkbox',
			// checked: false,
		});

		this.$tabState.watch((state) => {
			browser.contextMenus.update(this.menuItemId, {
				title: state.isTranslating ? 'Disable translation' : 'Translate page',
			});
		});

		browser.contextMenus.onClicked.addListener(this.onClickMenu);

		const updateMenuItem = async (tabId: number) => {
			const translateState = await getPageTranslateState(tabId);
			this.tabStateUpdated({
				tabId,
				isTranslating: translateState.isTranslated,
			});
		};

		browser.tabs.onActivated.addListener((info) => {
			updateMenuItem(info.tabId);
		});

		browser.tabs.onUpdated.addListener((tabId) => {
			updateMenuItem(tabId);
		});

		pageTranslatorStateUpdatedHandler((state, tabId) => {
			if (tabId === undefined || tabId !== this.$tabState.getState().tabId) return;

			this.tabStateUpdated({
				tabId,
				isTranslating: state.isTranslated,
			});
		});
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
