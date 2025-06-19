import { validateTranslatorCode } from '../../../lib/translators/customTranslators/utils';
import { type } from '../../../lib/types';
import { buildBackendRequest } from '../../utils/requestBuilder';

import { applyTranslators } from './applyTranslators';
import * as db from './data';
import { TranslatorEntry } from './data';

export const [updateTranslatorFactory, updateTranslator] = buildBackendRequest(
	'updateTranslator',
	{
		requestValidator: type.type({ id: type.number, translator: TranslatorEntry }),
		factoryHandler:
			() =>
				async ({ id, translator }) => {
					await validateTranslatorCode(translator.code);
					await db.updateTranslator(id, translator);
					await applyTranslators();
				},
	},
);
