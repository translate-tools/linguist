import { createEvent, createStore, Store } from 'effector';
import browser from 'webextension-polyfill';

import { defaultConfig } from '../config';
import { isBackgroundContext, isChromium, isFirefox } from '../lib/browser';
import { AppThemeControl } from '../lib/browser/AppThemeControl';
import { getAllTabs } from '../lib/browser/tabs';
import { TextTranslatorStorage } from '../pages/popup/tabs/TextTranslator/TextTranslator.utils/TextTranslatorStorage';
import { clearCache } from '../requests/backend/clearCache';
import { sendAppConfigUpdateEvent } from '../requests/global/appConfigUpdate';
import { customTranslatorsFactory } from '../requests/offscreen/customTranslators';
import { AppConfigType } from '../types/runtime';
import { Background } from './Background';
import { requestHandlers } from './Background/requestHandlers';
import { ConfigStorage, ObservableAsyncStorage } from './ConfigStorage/ConfigStorage';
import { TranslatePageContextMenu } from './ContextMenus/TranslatePageContextMenu';
import { TranslateSelectionContextMenu } from './ContextMenus/TranslateSelectionContextMenu';
import { migrateAll } from './migrations/migrationsList';

type OnInstalledData = null | browser.Runtime.OnInstalledDetailsType;

/**
 * Manage global states and application context
 */
export class App {
	/**
	 * Run application
	 */
	public static async main() {
		const onInstalled = createEvent<browser.Runtime.OnInstalledDetailsType>();
		browser.runtime.onInstalled.addListener(onInstalled);
		const $onInstalledData = createStore<OnInstalledData>(null);
		$onInstalledData.on(onInstalled, (_, onInstalledData) => onInstalledData);
		// Migrate data
		await migrateAll();
		const config = new ConfigStorage(defaultConfig);
		const observableConfig = new ObservableAsyncStorage(config);
		const background = new Background(observableConfig);
		const app = new App({ config: observableConfig, background, $onInstalledData });
		await app.start();
	}
	private readonly config: ObservableAsyncStorage<AppConfigType>;
	private readonly background: Background;
	private readonly $onInstalledData: Store<OnInstalledData>;
	constructor({
		config,
		background,
		$onInstalledData,
	}: {
		config: ObservableAsyncStorage<AppConfigType>;
		background: Background;
		$onInstalledData: Store<OnInstalledData>;
	}) {
		this.config = config;
		this.background = background;
		this.$onInstalledData = $onInstalledData;
	}
	private isStarted = false;
	public async start() {
		if (this.isStarted) {
			throw new Error('Application already started');
		}
		this.isStarted = true;
		await this.setupOffscreenDocuments();
		await this.background.start();
		await this.setupRequestHandlers();
		await this.handleConfigUpdates();
		this.$onInstalledData.watch(this.onInstalled);
	}
	private async setupOffscreenDocuments() {
		// Setup sandboxed iframes
		if (isChromium()) {
			// Currently `offscreen` API is non standard, so we cast type
			const offscreen = (globalThis as any).chrome.offscreen;
			// We may have only one offscreen document, but we need more,
			// so we create only one "main" document, that creates embedded iframes
			try {
				offscreen.createDocument({
					url: 'offscreen-documents/main/main.html',
					reasons: ['WORKERS', 'IFRAME_SCRIPTING', 'MATCH_MEDIA'],
					justification:
						'Main offscreen document, to run WASM and custom translators code in sandbox',
				});
			} catch (error) {
				if (
					!(error instanceof Error) ||
					!error.message.startsWith('Only a single offscreen')
				)
					throw error;
			}
		} else {
			customTranslatorsFactory();
		}
	}
	private async setupRequestHandlers() {
		// TODO: debug this condition and remove or move on top
		// Prevent run it again on other pages, such as options page
		if (!isFirefox() || isBackgroundContext()) {
			requestHandlers.forEach((factory) => {
				factory({ config: this.config, backgroundContext: this.background });
			});
		}
	}
	private async handleConfigUpdates() {
		const $appConfig = await this.config.getObservableStore();
		// Send update event
		$appConfig.watch((config) => {
			sendAppConfigUpdateEvent(config);
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
		const translateSelectionContextMenu = new TranslateSelectionContextMenu();
		$appConfig
			.map((config) => {
				const { enabled, mode } = config.selectTranslator;
				const isEnabled = enabled && mode === 'contextMenu';
				return isEnabled;
			})
			.watch((isEnabled) => {
				if (isEnabled) {
					translateSelectionContextMenu.enable();
				} else {
					translateSelectionContextMenu.disable();
				}
			});

		const translatePageContextMenu = new TranslatePageContextMenu();
		$appConfig
			.map((config) => config.pageTranslator.enableContextMenu)
			.watch((isEnabled) => {
				if (isEnabled) {
					translatePageContextMenu.enable();
				} else {
					translatePageContextMenu.disable();
				}
			});
	}
	private onInstalled = async (details: OnInstalledData) => {
		if (details === null) return;
		// Inject content scripts for chrome, to make page translation available just after install
		if (isChromium()) {
			const tabs = await getAllTabs();
			tabs.forEach((tab) => {
				if (tab.status === 'unloaded') return;
				// Ignore special URLs
				if (
					!tab.url ||
					tab.url.startsWith('chrome://') ||
					tab.url.startsWith('https://chrome.google.com')
				)
					return;
				browser.scripting.executeScript({
					target: { tabId: tab.id },
					files: ['contentscript.js'],
				});
			});
		}
	};
}
