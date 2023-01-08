import { TranslatorsCacheStorage } from '../../../modules/Background/TranslatorsCacheStorage';
import { getFormattedCustomTranslatorId } from '../../../modules/Background';
import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import * as db from './data';
import { applyTranslators } from './applyTranslators';

export const [deleteTranslatorFactory, deleteTranslator] = buildBackendRequest(
	'deleteTranslator',
	{
		requestValidator: type.number,

		factoryHandler: () => async (translatorId) => {
			// Delete translator
			await db.deleteTranslator(translatorId);
			await applyTranslators();

			// Delete translator cache
			const cache = new TranslatorsCacheStorage(
				getFormattedCustomTranslatorId(translatorId),
			);
			await cache.clear();
		},
	},
);
