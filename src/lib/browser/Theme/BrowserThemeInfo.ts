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

	// TODO: run in offscreen
	// private observer = (evt: any) => {
	// 	const isLightTheme = evt.matches;

	// 	this.handlers.forEach((handler) => {
	// 		handler({ isLightTheme });
	// 	});
	// };

	// private lightThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
	public async isLightTheme(): Promise<boolean> {
		return true;
	}

	public startObserve() {
		// this.lightThemeQuery.addEventListener('change', this.observer);
	}

	public stopObserve() {
		// this.lightThemeQuery.removeEventListener('change', this.observer);
	}
}
