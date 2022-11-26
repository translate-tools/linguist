import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';
import { TranslationType } from '../../../types/translation/Translation';

import { findEntry } from './data';

export const [findTranslationFactory, findTranslation] = buildBackendRequest(
	'findTranslation',
	{
		requestValidator: type.partial(TranslationType.props),
		responseValidator: type.union([type.number, type.null]),

		factoryHandler: () => async (translation) => {
			const entry = await findEntry({ translation });
			return entry === null ? null : entry.key;
		},
	},
);
