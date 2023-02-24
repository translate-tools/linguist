import { defaultConfig } from '../config';

import { AppConfigType } from '../types/runtime';
import { isBackgroundContext } from '../lib/browser';
import { AppThemeControl } from '../lib/browser/AppThemeControl';
import { toggleTranslateItemInContextMenu } from '../lib/browser/toggleTranslateItemInContextMenu';
import { migrateAll } from './migrations/migrationsList';
import { clearCache } from '../requests/backend/clearCache';

import { TextTranslatorStorage } from '../pages/popup/tabs/TextTranslator/TextTranslator.utils/TextTranslatorStorage';

import { ConfigStorage, ObservableAsyncStorage } from './ConfigStorage/ConfigStorage';

import { Background } from './Background';
import { requestHandlers } from './Background/requestHandlers';

import { sendConfigUpdateEvent } from './ContentScript';

import browser from 'webextension-polyfill';
import { getPageTranslateState } from '../requests/contentscript/pageTranslation/getPageTranslateState';
import { createEvent, createStore } from 'effector';
import { getTranslatorFeatures } from '../requests/backend/getTranslatorFeatures';
import { getConfig } from '../requests/backend/getConfig';
import { disableTranslatePage } from '../requests/contentscript/pageTranslation/disableTranslatePage';
import { enableTranslatePage } from '../requests/contentscript/pageTranslation/enableTranslatePage';
import { pageTranslatorStateUpdatedHandler } from './ContentScript/PageTranslator/requests/pageTranslatorStateUpdated';

type PageTranslationState = {
	tabId: null | number;
	isTranslating: boolean;
};

// TODO: move to a file
// TODO: add i18n texts
// TODO: add method `stop`
class TranslatePageContextMenu {
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

	public start() {
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

/**
 * Manage global states and application context
 */
export class App {
	/**
	 * Run application
	 */
	public static async main() {
		// Migrate data
		await migrateAll();

		const config = new ConfigStorage(defaultConfig);
		const observableConfig = new ObservableAsyncStorage(config);
		const background = new Background(observableConfig);

		const app = new App(observableConfig, background);
		await app.start();
	}

	private readonly background: Background;
	private readonly config: ObservableAsyncStorage<AppConfigType>;
	constructor(config: ObservableAsyncStorage<AppConfigType>, background: Background) {
		this.config = config;
		this.background = background;
	}

	private isStarted = false;
	public async start() {
		if (this.isStarted) {
			throw new Error('Application already started');
		}

		this.isStarted = true;

		await this.background.start();

		await this.handleConfigUpdates();
		await this.setupRequestHandlers();

		// TODO: move to a `handleConfigUpdates` method
		// TODO: enable only when option is enabled in config
		const translatePageContextMenu = new TranslatePageContextMenu();
		translatePageContextMenu.start();
	}

	private async setupRequestHandlers() {
		// Prevent run it again on other pages, such as options page
		if (isBackgroundContext()) {
			requestHandlers.forEach((factory) => {
				factory({
					config: this.config,
					backgroundContext: this.background,
				});
			});
		}
	}

	private async handleConfigUpdates() {
		const $appConfig = await this.config.getObservableStore();

		// Send update event
		$appConfig.watch(() => {
			sendConfigUpdateEvent();
		});

		// Update icon
		const appThemeControl = new AppThemeControl();
		$appConfig
			.map((config) => config.appIcon)
			.watch((appIcon) => {
				appThemeControl.setAppIconPreferences(appIcon);
			});

		// Clear cache while disable
		$appConfig
			.map((config) => config.scheduler.useCache)
			.watch((useCache) => {
				if (!useCache) {
					clearCache();
				}
			});

		// Clear TextTranslator state
		const textTranslatorStorage = new TextTranslatorStorage();
		$appConfig
			.map((config) => config.textTranslator.rememberText)
			.watch((rememberText) => {
				if (!rememberText) {
					textTranslatorStorage.forgetText();
				}
			});

		// Configure context menu
		$appConfig
			.map((config) => config.selectTranslator)
			.watch((selectTranslator) => {
				const { enabled, mode } = selectTranslator;
				const isEnabled = enabled && mode === 'contextMenu';
				toggleTranslateItemInContextMenu(isEnabled);
			});
	}
}
