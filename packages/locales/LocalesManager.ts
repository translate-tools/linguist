import isEqual from 'deep-equal';
import deepmerge from 'deepmerge';
import traverse from 'traverse';

import { LLMJsonTranslator } from './LLMJsonTranslator';
import { getObjectPatch } from './utils/json';

type LocaleObject = Record<any, any>;

type LocaleInfo = {
	language: string;
	content: LocaleObject;
};

export class LocalesManager {
	constructor(private readonly jsonTranslator: LLMJsonTranslator) {}

	/**
	 * Sync `target` object with `source` object and translates all changed parts.
	 *
	 * In case source object have changes and `target` must be forced to update its values,
	 * provide `previous` object version to `source`
	 */
	public async sync({
		source,
		target,
		skip,
	}: {
		target: LocaleInfo;
		source: LocaleInfo & {
			previous?: LocaleObject;
		};
		skip?: (context: { locale: LocaleInfo; path: string[] }) => boolean;
	}): Promise<LocaleObject> {
		let changesToOverride: LocaleObject = {};

		// Find changes in source
		if (source.previous) {
			const patch = getObjectPatch(source.content, source.previous, Object.is);
			changesToOverride = patch.superset;
		}

		// Find changes between target ans source
		const patch = getObjectPatch(source.content, target.content);

		// Translate superset + slice to override,
		// that has been changed in source object
		const diff = deepmerge(patch.superset, changesToOverride);

		const pathsToSkip: string[][] = skip
			? traverse(target.content)
				.paths()
				.slice(1)
				.filter((path) =>
					skip({
						locale: structuredClone(target),
						path: path,
					}),
				)
			: [];

		const diffToTranslate = skip
			? traverse(diff).map(function fn() {
				if (this.isRoot) return;

				const shouldSkipNode = pathsToSkip.some((path) =>
					isEqual(path, this.path),
				);
				if (shouldSkipNode) {
					this.remove();

					// Don't walk nested elements
					this.block();
				}
			  })
			: diff;

		const translatedPatch = await this.jsonTranslator.translate(
			diffToTranslate,
			source.language,
			target.language,
		);

		// Form slice with ignored parts
		const ignoredParts = pathsToSkip
			? traverse(target.content).map(function fn() {
				if (this.isRoot) return;

				// Left in object only nodes that been skipped
				const isSkippedNode = pathsToSkip.some((path) =>
					isEqual(path, this.path),
				);
				if (isSkippedNode) {
					// Left whole node with all content
					this.block();
					return;
				}

				this.remove();
			  })
			: {};

		return deepmerge.all([patch.subset, translatedPatch, ignoredParts]);
	}
}
