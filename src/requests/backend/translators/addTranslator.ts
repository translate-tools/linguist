import { validateTranslatorCode } from '../../../lib/translators/customTranslators/utils';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { applyTranslators } from './applyTranslators';
import * as db from './data';
import { TranslatorEntry } from './data';

export const [addTranslatorFactory, addTranslator] = buildBackendRequest(
	'addTranslator',
	{
		requestValidator: TranslatorEntry,

		factoryHandler: () => async (data) => {
			console.log('addTranslatorFactory received request');
			await validateTranslatorCode(data.code);

			await db.addTranslator(data);
			await applyTranslators();
		},
	},
);
