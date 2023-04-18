import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { applyTranslators } from './applyTranslators';
import * as db from './data';
import { TranslatorEntry } from './data';
import { loadTranslator } from './utils';

export const [updateTranslatorFactory, updateTranslator] = buildBackendRequest(
	'updateTranslator',
	{
		requestValidator: type.type({
			id: type.number,
			translator: TranslatorEntry,
		}),

		factoryHandler:
			() =>
				async ({ id, translator }) => {
					loadTranslator(translator.code);

					await db.updateTranslator(id, translator);
					await applyTranslators();
				},
	},
);
