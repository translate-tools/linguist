import { TranslatorClass } from '@translate-tools/core/types/Translator';

import {
	getFormattedCustomTranslatorId,
	embeddedTranslators,
	TranslatorsMap,
} from '../../../app/Background';

import { getTranslators } from './data';
import { loadTranslator } from './utils';

/**
 * Return map with all available translators, where keys is translators id
 */
export const getTranslatorsClasses = async (): Promise<TranslatorsMap> => {
	const translatorsMap: Record<string, TranslatorClass> = { ...embeddedTranslators };

	// Validate and collect custom translators
	const customTranslators = await getTranslators({ order: 'asc' });
	for (const { key, data: translatorData } of customTranslators) {
		const translatorId = getFormattedCustomTranslatorId(key);
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
