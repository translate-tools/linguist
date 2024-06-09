import browser from 'webextension-polyfill';

import { AppConfigType } from '../../types/runtime';

export type AppIcon = Exclude<AppConfigType['appIcon'], 'auto'>;

export const iconsMap = {
	dark: 'static/logo/logo-icon-simple-dark.png',
	light: 'static/logo/logo-icon-simple-light.png',
	color: 'static/logo/logo-icon.png',
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
	console.log({ iconPath });
	browser.action.setIcon({
		path: {
			32: iconPath,
		},
	});
};
