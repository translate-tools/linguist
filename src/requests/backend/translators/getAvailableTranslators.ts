import { embeddedTranslators } from '../../../app/Background';
import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

import * as db from './data';
import { formatToCustomTranslatorId } from '.';
/** * Return all available translators both, embedded and custom */
export const [getAvailableTranslatorsFactory, getAvailableTranslators] =
	buildBackendRequest('getAvailableTranslators', {
		responseValidator: type.record(type.string, type.string),
		factoryHandler: () => async () => {
			const translatorsMap: Record<string, string> = {};
			// Collect embedded translators
			for (const [key, translatorClass] of Object.entries(embeddedTranslators)) {
				translatorsMap[key] = translatorClass.translatorName;
			}
			// Add custom translators
			const customTranslators = await db.getTranslators({ order: 'asc' });
			customTranslators.forEach(({ key, data }) => {
				translatorsMap[formatToCustomTranslatorId(key)] = data.name;
			});
			return translatorsMap;
		},
	});
