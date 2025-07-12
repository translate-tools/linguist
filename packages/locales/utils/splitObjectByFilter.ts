import isEqual from 'deep-equal';
import traverse from 'traverse';

export type ObjectFilter<T extends {} = {}> = (context: {
	content: T;
	path: string[];
}) => boolean;

/**
 * Split object by filter to `included` and `excluded` subsets
 */

export const splitObjectByFilter = <T extends {} = {}>(
	object: T,
	filter: ObjectFilter<T>,
) => {
	const includedPaths: string[][] = traverse(object)
		.paths()
		.slice(1)
		.filter((path) =>
			filter({
				content: structuredClone(object),
				path: path,
			}),
		);

	const included = traverse(object).map(function fn() {
		if (this.isRoot) return;

		// Delete not included nodes
		const isIncluded = includedPaths.some((path) => isEqual(path, this.path));
		if (!isIncluded) {
			this.remove();

			// Don't walk nested elements
			this.block();
		}
	});

	const excluded = traverse(object).map(function fn() {
		if (this.isRoot) return;

		// Collect filtered out nodes
		const isIncluded = includedPaths.some((path) => isEqual(path, this.path));
		if (isIncluded) {
			this.remove();
		} else {
			// Left whole node with all content
			this.block();
		}
	});

	return { included, excluded };
};
