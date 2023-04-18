import { buildBackendRequest } from '../../utils/requestBuilder';

import { applyTranslators } from './applyTranslators';
import * as db from './data';
import { TranslatorEntry } from './data';
import { loadTranslator } from './utils';

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
