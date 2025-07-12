import traverse, { Traverse, TraverseContext } from 'traverse';

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

export const getPathHash = (path: string[]) => path.join('.');

export const getObjectPathsFromTraverse = (
	traverseContext: Traverse<any>,
	allPaths = false,
) => {
	const paths: string[] = [];
	traverseContext.forEach(function() {
		if (this.isRoot) return;

		if (allPaths || this.isLeaf) {
			paths.push(getPathHash(this.path));
		}
	});

	return paths;
};

export const getObjectPaths = (object: Record<any, any>, allPaths = false) =>
	getObjectPathsFromTraverse(traverse(object), allPaths);

// TODO: simplify implementation
/**
 * Returns object that contains subset or superset of `source` derived of `target` object
 *
 * In case a mode is `intersection`, will be returned slice of `target` object with all values that match `source` object.
 * In case a mode is `diff`, will be returned slice of `target` object with all values that not match `source` object.
 *
 * @param source Reference object
 * @param target Object to compare structure and values with `source`
 * @param mode 'diff' | 'intersection'
 * @param isEqual Function that will be called for primitive values to check equality
 * @returns
 */
export const getObjectsDiff = (
	source: Record<any, any>,
	target: Record<any, any>,
	mode: 'diff' | 'intersection',
	isEqual: ValuesEqualityPredicate = Object.is,
) => {
	const sourceWalker = traverse(source);
	const targetWalker = traverse(target);

	const intersection = targetWalker.map(function() {
		if (this.isRoot) return;

		// Remove whole subtrees that is not match the search mode
		if (!sourceWalker.has(this.path)) {
			this.block();
			this.remove();

			return;
		}

		const currentNode = this.node;
		const targetNode = sourceWalker.get(this.path);

		// Handle case if node types is not equal
		if (getType(currentNode) !== getType(targetNode)) {
			// Don't traverse nested nodes
			this.block();
			this.remove();

			return;
		}

		// Continue traversing for objects
		if (getType(currentNode) === 'object' || getType(currentNode) === 'array') return;

		// Check primitive values equality with a predicate
		if (!isEqual(currentNode, targetNode)) {
			// Don't traverse nested nodes (just for safe, to ensure it will not continue)
			this.block();
			this.remove();

			return;
		}
	});

	if (mode === 'intersection') return intersection;

	const intersectionWalker = traverse(intersection);
	return targetWalker.map(function() {
		if (this.isRoot || !this.isLeaf) return;

		if (!intersectionWalker.has(this.path)) return;

		this.remove();

		// Remove parents
		let context: TraverseContext | undefined = this;
		while ((context = context.parent)) {
			if (context.isRoot) break;

			if (!intersectionWalker.has(context.path)) break;

			let shouldRemoveParent = true;

			// Check parent for nodes out of intersection
			const objectKeys = context.keys ?? [];
			if (objectKeys.length > 0) {
				for (const key of objectKeys) {
					if (!intersectionWalker.has([...context.path, key])) {
						shouldRemoveParent = false;
						break;
					}
				}
			}

			if (shouldRemoveParent) {
				context.remove();
			} else {
				break;
			}
		}
	});
};
