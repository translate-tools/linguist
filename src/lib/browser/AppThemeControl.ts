import { AppConfigType } from '../../types/runtime';

import { setAppIcon } from './setAppIcon';
import { getBrowserThemeInfo, ThemeChangeHandler } from './Theme';
import { BrowserThemeInfo } from './Theme/BrowserThemeInfo';
import { FirefoxThemeInfo } from './Theme/FirefoxThemeInfo';

export class AppThemeControl {
	private browserThemeInfo: BrowserThemeInfo | FirefoxThemeInfo;

	constructor() {
		const themeInfoClass = getBrowserThemeInfo();
		this.browserThemeInfo = new themeInfoClass();
	}

	private updateTheme: ThemeChangeHandler = ({ isLightTheme }) => {
		setAppIcon(isLightTheme ? 'dark' : 'light');
	};

	/**
	 * Update icon depends on preferences
	 */
	public setAppIconPreferences = async (icon: AppConfigType['appIcon']) => {
		// Set static icon
		if (icon !== 'auto') {
			this.browserThemeInfo.stopObserve();
			setAppIcon(icon);
			return;
		}

		// Set icon
		const isLightTheme = await this.browserThemeInfo.isLightTheme();
		this.updateTheme({ isLightTheme });

		// Observe theme
		this.browserThemeInfo.subscribe(this.updateTheme);
		this.browserThemeInfo.startObserve();
	};
}
