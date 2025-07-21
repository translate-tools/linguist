import { BrowserThemeInfo } from './BrowserThemeInfo';
import { FirefoxThemeInfo } from './FirefoxThemeInfo';

/**
 * Select implementation of `ThemeInfo` to explore browser theme
 *
 * WARNING: it's can't explore chromium theme
 */
export const getBrowserThemeInfo = () => {
	if (navigator.userAgent.includes('Firefox')) {
		return FirefoxThemeInfo;
	}

	return BrowserThemeInfo;
};

export * from './ThemeInfo';
