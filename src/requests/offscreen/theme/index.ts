import { buildBackendRequest } from '../../utils/requestBuilder';

type ThemeContext = {
	onChange: (isLightTheme: boolean) => void;
};

export const [themeUpdateFactory, themeUpdate] = buildBackendRequest<
	{ isLight: boolean },
	void,
	ThemeContext
>('customTranslator.create', {
	factoryHandler:
		({ onChange }) =>
			async ({ isLight }) => {
				onChange(isLight);
			},
});
