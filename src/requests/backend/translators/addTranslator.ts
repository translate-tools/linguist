import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';

import { addEntry } from './data';

export const [addTranslatorFactory, addTranslator] = buildBackendRequest(
	'addTranslator',
	{
		requestValidator: type.type({
			name: type.string,
			code: type.string,
		}),

		factoryHandler: () => async (data) => {
			// TODO: validate the code
			await addEntry(data);
		},
	},
);
