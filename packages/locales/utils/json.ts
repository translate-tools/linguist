export const sliceJsonString = (sourceJson: string, maxLength: number) => {
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
		if (JSON.stringify(Object.fromEntries(candidate)).length <= maxLength) {
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

export function isEqualStructures(a: unknown, b: unknown): boolean {
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
			if (!isEqualStructures(arrA[i], arrB[i])) return false;
		}
		return true;
	}

	// For primitive types: types must match, values don't matter
	return true;
}
