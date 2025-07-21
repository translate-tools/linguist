import { colord } from 'colord';
import browser from 'webextension-polyfill';

import { ThemeChangeHandler, ThemeInfo } from './ThemeInfo';

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
export type FirefoxTheme = {
	colors: Record<any, any>;
};

const isLightText = (theme: FirefoxTheme) => {
	const textColor = theme?.colors.toolbar_field_text ?? null;

	if (textColor === null) return null;

	const brightness = colord(textColor).brightness();
	return brightness > 0.5;
};

/**
 * Class to explore firefox theme
 */
export class FirefoxThemeInfo implements ThemeInfo {
	private readonly handlers;
	constructor() {
		this.handlers = new Set<ThemeChangeHandler>();
	}

	public subscribe(handler: ThemeChangeHandler) {
		this.handlers.add(handler);
	}

	public unsubscribe(handler: ThemeChangeHandler) {
		this.handlers.delete(handler);
	}

	private readonly observer = ({ theme }: any) => {
		const isLightTheme = this.isLightThemePredicate(theme);

		this.handlers.forEach((handler) => {
			handler({ isLightTheme });
		});
	};

	private readonly isLightThemePredicate = (theme: any) => {
		const isLightThemeText = isLightText(theme);
		const isLightTheme = !isLightThemeText;
		return isLightTheme;
	};

	public async isLightTheme(): Promise<boolean> {
		const theme = await browser.theme.getCurrent();
		return this.isLightThemePredicate(theme);
	}

	public startObserve() {
		browser.theme.onUpdated.addListener(this.observer);
	}

	public stopObserve() {
		browser.theme.onUpdated.removeListener(this.observer);
	}
}
