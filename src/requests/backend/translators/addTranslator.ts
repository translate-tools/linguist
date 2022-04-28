import { buildBackendRequest } from '../../utils/requestBuilder';

import * as db from './data';
import { TranslatorEntry } from './data';
import { loadTranslator } from './utils';
import { applyTranslators } from './applyTranslators';

export const [addTranslatorFactory, addTranslator] = buildBackendRequest(
	'addTranslator',
	{
		requestValidator: TranslatorEntry,

		factoryHandler: () => async (data) => {
			loadTranslator(data.code);

			await db.addTranslator(data);
			await applyTranslators();
		},
	},
);
