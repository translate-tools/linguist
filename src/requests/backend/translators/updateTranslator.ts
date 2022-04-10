import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import * as db from './data';
import { TranslatorEntry } from './data';
import { loadTranslator } from './utils';
import { applyTranslators } from './applyTranslators';

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
