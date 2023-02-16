import { getFormattedCustomTranslatorId } from '../../../app/Background';
import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

import * as db from './data';

/**
 * Return all available translators both, embedded and custom
 */
export const [getAvailableTranslatorsFactory, getAvailableTranslators] =
	buildBackendRequest('getAvailableTranslators', {
		responseValidator: type.record(type.string, type.string),
		factoryHandler:
			({ translators }) =>
				async () => {
					const translatorsMap: Record<string, string> = {};

					// Collect embedded translators
					for (const key in translators) {
						translatorsMap[key] = translators[key].translatorName;
					}

					// Add custom translators
					const customTranslators = await db.getTranslators({ order: 'asc' });
					customTranslators.forEach(({ key, data }) => {
						translatorsMap[getFormattedCustomTranslatorId(key)] = data.name;
					});

					return translatorsMap;
				},
	});
