import { EventManager } from '../../EventManager';

export type ThemeChangeHandler = (info: { isLightTheme: boolean }) => void;

/**
 * Basic browser theme info class to get theme data and observe theme changes
 */
export abstract class ThemeInfo {
	protected eventManager = new EventManager<{ updateTheme: ThemeChangeHandler }>();

	public subscribe(handler: ThemeChangeHandler) {
		this.eventManager.subscribe('updateTheme', handler);
	}

	public unsubscribe(handler: ThemeChangeHandler) {
		this.eventManager.unsubscribe('updateTheme', handler);
	}

	public abstract isLightTheme(): Promise<boolean>;

	public abstract startObserve(): void;
	public abstract stopObserve(): void;
}
