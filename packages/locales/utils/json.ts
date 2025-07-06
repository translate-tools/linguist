export type ValuesEqualityPredicate = (a: unknown, b: unknown) => boolean;

export const sliceJsonString = (
	sourceJson: string,
	maxLength: number,
	maxSize?: number,
) => {
	const json = JSON.parse(sourceJson);
	if (typeof json !== 'object' || json === null)
		throw new TypeError('Json data cannot be split to slices');

	const result: Array<Array<[string, unknown]>> = [];
	let offset = 0;
	for (const slice of Object.entries(json)) {
		const isEmptyChunk = result[offset] && result[offset].length > 0;

		// Fill immediately for empty chunks
		if (!isEmptyChunk) {
			result[offset] = [slice];
			continue;
		}

		// Fill if fit
		const candidate = [...result[offset], slice];
		if (
			JSON.stringify(Object.fromEntries(candidate)).length <= maxLength &&
			(!maxSize || result[offset].length < maxSize)
		) {
			result[offset] = candidate;
			continue;
		}

		// Fill next chunk
		result[++offset] = [slice];
		continue;
	}

	return result.map((entries) => JSON.stringify(Object.fromEntries(entries)));
};

export function getType(value: unknown): string {
	if (Array.isArray(value)) return 'array';
	if (value === null) return 'null';
	return typeof value;
}

export function isEqualStructures(
	a: unknown,
	b: unknown,
	predicate?: ValuesEqualityPredicate,
): boolean {
	const typeA = getType(a);
	const typeB = getType(b);
	if (typeA !== typeB) return false;

	if (typeA === 'object') {
		const keysA = Object.keys(a as object);
		const keysB = Object.keys(b as object);
		if (keysA.length !== keysB.length) return false;
		keysA.sort();
		keysB.sort();
		for (let i = 0; i < keysA.length; i++) {
			if (keysA[i] !== keysB[i]) return false;
		}
		for (const key of keysA) {
			if (
				!isEqualStructures(
					(a as Record<string, unknown>)[key],
					(b as Record<string, unknown>)[key],
					predicate,
				)
			) {
				return false;
			}
		}
		return true;
	}

	if (typeA === 'array') {
		const arrA = a as unknown[];
		const arrB = b as unknown[];
		if (arrA.length !== arrB.length) return false;
		for (let i = 0; i < arrA.length; i++) {
			if (!isEqualStructures(arrA[i], arrB[i], predicate)) return false;
		}
		return true;
	}

	if (predicate) {
		return predicate(a, b);
	}

	// For primitive types: types must match, values don't matter
	return true;
}

/**
 * Function analyze objects and return patch object
 * with `subset` of `target` object that is object that completely match with `source,
 * and `superset` object that contains slice of `source` object that is differ of `target`.
 *
 * @param source Source object with actual structure
 * @param target Object to patch
 */
export const getObjectPatch = (
	source: Record<any, any>,
	target: Record<any, any>,
	predicate?: ValuesEqualityPredicate,
): {
	/**
	 * Subset of `target` object with structure equal to `source`
	 */
	subset: Record<any, any>;
	/**
	 * Part of `source` object that is not present in `subset`
	 */
	superset: Record<any, any>;
} => {
	const subset = Object.fromEntries(
		Object.entries(target).filter(([key]) =>
			isEqualStructures(source[key], target[key], predicate),
		),
	);
	const superset = Object.fromEntries(
		Object.entries(source).filter(([key]) => key in subset === false),
	);

	return {
		subset,
		superset,
	};
};
