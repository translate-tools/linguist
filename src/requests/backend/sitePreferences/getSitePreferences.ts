import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';

import { dataSignature, getPreferences } from './utils';

export const getSitePreferencesOut = type.union([dataSignature, type.null]);

export const getSitePreferences = (site: string): ReturnType<typeof getPreferences> =>
	bgSendRequest('getSitePreferences', { site }).then((rsp) =>
		tryDecode(getSitePreferencesOut, rsp),
	);

export const getSitePreferencesIn = type.type({
	site: type.string,
});

export const getSitePreferencesFactory: RequestHandlerFactory = () => {
	addRequestHandler('getSitePreferences', async (rawData) => {
		const { site } = tryDecode(getSitePreferencesIn, rawData);

		return getPreferences(site);
	});
};
