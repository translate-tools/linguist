import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { findEntry } from './data';

export const [findTranslationFactory, findTranslation] = buildBackendRequest(
	'findTranslation',
	{
		requestValidator: type.type({
			from: type.union([type.string, type.undefined]),
			to: type.union([type.string, type.undefined]),
			text: type.union([type.string, type.undefined]),
			translate: type.union([type.string, type.undefined]),
		}),
		responseValidator: type.union([type.number, type.null]),

		factoryHandler: () => async (data) => {
			const entry = await findEntry(data);
			return entry === null ? null : entry.key;
		},
	},
);
