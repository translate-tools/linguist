import { buildBackendRequest } from '../../../lib/requests/requestBuilder';
import { type } from '../../../lib/types';

import { addEntry } from './data';

export const [addTranslationFactory, addTranslation] = buildBackendRequest(
	'addTranslation',
	{
		requestValidator: type.type({
			from: type.string,
			to: type.string,
			text: type.string,
			translate: type.string,
		}),
		responseValidator: type.number,

		factoryHandler: () => (data) => addEntry({ ...data, date: new Date().getTime() }),
	},
);
