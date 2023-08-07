import { TranslatorConstructor } from '@translate-tools/core/translators/Translator';

import { embeddedTranslators, TranslatorsMap } from '../../../app/Background';

import { getTranslators } from './data';
import { loadTranslator } from './utils';

export type CustomTranslator = {
	id: number;
	name: string;
	code: string;
};

/**
 * Format custom translator unique id as key to use with another translators
 */
export const formatToCustomTranslatorId = (id: number) => '#' + id;

/**
 * Detect custom translator id signature
 */
export const isCustomTranslatorId = (id: string) => id.startsWith('#');

/**
 * Return map with all available translators, where keys is translators id
 */
export const getTranslatorsClasses = async (): Promise<TranslatorsMap> => {
	const translatorsMap: Record<string, TranslatorConstructor> = {
		...embeddedTranslators,
	};

	// Validate and collect custom translators
	const customTranslators = await getTranslators({ order: 'asc' });
	for (const { key, data: translatorData } of customTranslators) {
		const translatorId = formatToCustomTranslatorId(key);
		try {
			translatorsMap[translatorId] = loadTranslator(translatorData.code);
		} catch (error) {
			console.error(
				`Translator "${translatorData.name}" (id:${key}) is thrown exception`,
				error,
			);
		}
	}

	return translatorsMap;
};
