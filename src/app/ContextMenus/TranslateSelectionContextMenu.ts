import browser, { Menus, Tabs } from 'webextension-polyfill';

import { isFirefox } from '../../lib/browser';
import { isValidBrowserTabId } from '../../lib/browser/tabs';
import { getMessage } from '../../lib/language';
import { translateSelectedText } from '../../requests/contentscript/translateSelectedText';

export class TranslateSelectionContextMenu {
	private menuId = 'translateText';
	private isEnabled = false;

	public enable() {
		if (this.isEnabled) return;
		this.isEnabled = true;

		browser.contextMenus.onClicked.addListener(this.onClicked);
		browser.contextMenus.create({
			id: this.menuId,
			contexts: ['selection'],
			title: getMessage('contextMenu_translateSelectedText'),
			...(isFirefox() ? { viewTypes: ['tab'] } : {}),
		});
	}
	public disable() {
		if (!this.isEnabled) return;
		this.isEnabled = false;

		browser.contextMenus.onClicked.removeListener(this.onClicked);
		browser.contextMenus.remove(this.menuId);
	}

	private onClicked = (info: Menus.OnClickData, tab: Tabs.Tab | undefined) => {
		if (info.menuItemId !== this.menuId || !tab || !isValidBrowserTabId(tab.id))
			return;

		translateSelectedText(tab.id);
	};
}
