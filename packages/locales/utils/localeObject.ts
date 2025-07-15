export const orderKeysInLocalizationObject = (object: Record<any, any>) =>
	Object.fromEntries(
		Object.entries(object).sort(([keyA], [keyB]) => {
			const sortPredicate = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0);

			// Lexicographical sorting
			return sortPredicate(keyA, keyB);
		}),
	);

export const postprocessLocale = (localeObject: Record<any, any>) => {
	return orderKeysInLocalizationObject(localeObject);
};
