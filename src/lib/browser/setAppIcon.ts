import browser from 'webextension-polyfill';
import { isFirefox } from '@react-aria/utils';

import { AppConfigType } from '../../types/runtime';

export type AppIcon = Exclude<AppConfigType['appIcon'], 'auto'>;

// TODO: remove icon object usage
export const getAppIconPath = (_icon: AppIcon, absolutePath = false) => {
	const relativePath = 'static/logo.png';
	return absolutePath ? browser.runtime.getURL(relativePath) : relativePath;
};

/**
 * Set static icon
 */
export const setAppIcon = (icon: AppIcon) => {
	const iconPath = getAppIconPath(icon);
	(isFirefox() ? browser.browserAction : browser.action).setIcon({
		path: {
			128: iconPath,
		},
	});
};
