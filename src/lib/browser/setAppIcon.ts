import browser from 'webextension-polyfill';
import { AppConfigType } from '../../types/runtime';

export type AppIcon = Exclude<AppConfigType['appIcon'], 'auto'>;

export const iconsMap = {
	dark: 'static/logo-icon-simple-dark.svg',
	light: 'static/logo-icon-simple-light.svg',
	color: 'static/logo-icon.svg',
} as const;

export const getAppIconPath = (icon: AppIcon, absolutePath = false) => {
	const relativePath = iconsMap[icon === 'color' ? 'color' : icon];
	return absolutePath ? browser.runtime.getURL(relativePath) : relativePath;
};

/**
 * Set static icon
 */
export const setAppIcon = (icon: AppIcon) => {
	const iconPath = getAppIconPath(icon);
	browser.browserAction.setIcon({
		path: {
			32: iconPath,
		},
	});
};
