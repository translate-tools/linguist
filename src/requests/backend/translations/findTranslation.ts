import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';
import { TranslationType } from '../../../types/translation/Translation';

import { findEntry } from './data';

export const [findTranslationFactory, findTranslation] = buildBackendRequest(
	'findTranslation',
	{
		requestValidator: type.partial(TranslationType.props),
		responseValidator: type.union([type.number, type.null]),

		factoryHandler: () => async (data) => {
			const entry = await findEntry(data);
			return entry === null ? null : entry.key;
		},
	},
);
