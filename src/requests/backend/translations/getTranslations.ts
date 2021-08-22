import { buildBackendRequest } from '../../../lib/requests/requestBuilder';
import { type } from '../../../lib/types';
import { EntryWithKey, getEntries } from './data';

export const [getTranslationsFactory, getTranslations] = buildBackendRequest(
	'getTranslations',
	{
		responseValidator: type.array(EntryWithKey),
		factoryHandler: () => () =>
			getEntries().then(
				(entries) =>
					// FIXME: remove this cast
					entries as any,
			),
	},
);
