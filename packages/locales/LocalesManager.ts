import deepmerge from 'deepmerge';

import { LLMTranslator } from './LLMTranslator';
import { getObjectPatch } from './utils/json';

type LocaleObject = Record<any, any>;

type LocaleInfo = {
	language: string;
	content: LocaleObject;
};

export class LocalesManager {
	constructor(private readonly llmTransformer: LLMTranslator) {}

	/**
	 * Sync `target` object with `source` object and translates all changed parts.
	 *
	 * In case source object have changes and `target` must be forced to update its values,
	 * provide `previous` object version to `source`
	 */
	public async sync({
		source,
		target,
	}: {
		target: LocaleInfo;
		source: LocaleInfo & {
			previous?: LocaleObject;
		};
	}): Promise<LocaleObject> {
		let changesToOverride: LocaleObject = {};

		// Find changes in source
		if (source.previous) {
			const patch = getObjectPatch(source.content, source.previous, Object.is);
			changesToOverride = patch.superset;
		}

		// Find changes between target ans source
		const patch = getObjectPatch(source.content, target.content);

		const translatedPatch = await this.llmTransformer.translate(
			// Translate superset + slice to override,
			// that has been changed in source object
			deepmerge(patch.superset, changesToOverride),
			source.language,
			target.language,
		);

		return deepmerge(patch.subset, translatedPatch);
	}
}
