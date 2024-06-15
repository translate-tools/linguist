import { themeUpdateFactory } from '../../../requests/offscreen/theme';

import { ThemeChangeHandler, ThemeInfo } from './ThemeInfo';

/**
 * Class to explore browser theme
 */
export class BrowserThemeInfo implements ThemeInfo {
	private handlers;
	constructor() {
		this.handlers = new Set<ThemeChangeHandler>();
	}

	public subscribe(handler: ThemeChangeHandler) {
		this.handlers.add(handler);
	}

	public unsubscribe(handler: ThemeChangeHandler) {
		this.handlers.delete(handler);
	}

	private isLight = true;
	public async isLightTheme(): Promise<boolean> {
		return this.isLight;
	}

	private cleanupRequestsHandler: (() => void) | null = null;
	public startObserve() {
		this.cleanupRequestsHandler = themeUpdateFactory({
			onChange: (isLightTheme) => {
				this.isLight = isLightTheme;
				this.handlers.forEach((handler) => {
					handler({ isLightTheme });
				});
			},
		});
	}

	public stopObserve() {
		if (this.cleanupRequestsHandler) {
			this.cleanupRequestsHandler();
		}
	}
}
