export type ThemeData = { isLightTheme: boolean };
export type ThemeChangeHandler = (info: ThemeData) => void;

/**
 * Browser theme info class to get theme data and observe theme changes
 */
export interface ThemeInfo {
	isLightTheme: () => Promise<boolean>;

	startObserve: () => void;
	stopObserve: () => void;

	subscribe: (handler: ThemeChangeHandler) => void;
	unsubscribe: (handler: ThemeChangeHandler) => void;
}
