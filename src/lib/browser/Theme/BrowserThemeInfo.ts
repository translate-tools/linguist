import { ThemeInfo } from './ThemeInfo';

/**
 * Class to explore browser theme
 */
export class BrowserThemeInfo extends ThemeInfo {
	private lightThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
	private observer = (evt: any) => {
		const isLightTheme = evt.matches;

		this.eventManager.emit('updateTheme', [{ isLightTheme }]);
	};

	public async isLightTheme(): Promise<boolean> {
		return this.lightThemeQuery.matches;
	}

	public startObserve() {
		this.lightThemeQuery.addEventListener('change', this.observer);
	}

	public stopObserve() {
		this.lightThemeQuery.removeEventListener('change', this.observer);
	}
}
