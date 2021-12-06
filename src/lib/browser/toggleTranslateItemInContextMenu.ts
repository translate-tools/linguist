import { browser, Menus, Tabs } from 'webextension-polyfill-ts';

import { contextMenuIds } from '../../constants';
import { translateSelectedText } from '../../requests/contentscript/translateSelectedText';

const translateTextHandler = (info: Menus.OnClickData, tab: Tabs.Tab | undefined) => {
	if (info.menuItemId !== contextMenuIds.translateText || !tab || !tab.id) return;

	translateSelectedText(tab.id);
};

export function toggleTranslateItemInContextMenu(state: boolean) {
	if (state) {
		browser.contextMenus.onClicked.addListener(translateTextHandler);
		browser.contextMenus.create({
			id: contextMenuIds.translateText,
			title: 'Translate text',
			contexts: ['all'],
		});
	} else {
		browser.contextMenus.onClicked.removeListener(translateTextHandler);
		browser.contextMenus.remove(contextMenuIds.translateText);
	}
}
