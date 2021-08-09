import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';

import { dataSignature, setPreferences, SiteData } from './utils';

export const setSitePreferences = (site: string, data: SiteData): Promise<void> =>
	bgSendRequest('setSitePreferences', { site, options: data });

const setSitePreferencesIn = type.type({
	site: type.string,
	options: dataSignature,
});

export const setSitePreferencesFactory: RequestHandlerFactory = () => {
	addRequestHandler('setSitePreferences', async (rawData) => {
		const { site, options } = tryDecode(setSitePreferencesIn, rawData);

		await setPreferences(site, options);
	});
};
