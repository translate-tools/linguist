import { isEqual } from 'lodash';

export const isTextsContainsSubstring = (
	substring: string,
	texts: string[],
	ignoreCase: boolean = true,
) => {
	const textToSearch = ignoreCase ? substring.toLowerCase() : substring;

	const isSomeTextMatch = texts.some((text) => {
		const transformedText = ignoreCase ? text.toLowerCase() : text;
		return transformedText.includes(textToSearch);
	});

	return isSomeTextMatch;
};

/**
 * Check second object contains all properties of first object with equal values
 */
export const isEqualIntersection = (obj1: any, obj2: any): boolean => {
	// Compare primitive values
	if (typeof obj1 !== 'object' && typeof obj2 !== 'object') {
		return obj1 === obj2;
	}

	const xIsArray = Array.isArray(obj1);
	const yIsArray = Array.isArray(obj2);

	// Compare arrays
	if (xIsArray && yIsArray) {
		return isEqual(obj1, obj2);
	} else if (xIsArray || yIsArray) {
		return false;
	}

	// Compare objects
	return Object.keys(obj1).every((key) => isEqualIntersection(obj1[key], obj2[key]));
};
