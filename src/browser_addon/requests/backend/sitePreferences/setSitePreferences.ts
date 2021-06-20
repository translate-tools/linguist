import { addRequestHandler, bgSendRequest } from '../../../lib/communication';
import { tryDecode, type } from '../../../lib/types';
import { RequestHandlerFactory } from '../../types';

import { setPreferences, SiteData } from './utils';

export const setSitePreferences = (site: string, data: SiteData): Promise<void> =>
	bgSendRequest('setSitePreferences', { ...data, site });

const setSitePreferencesIn = type.type({
	site: type.string,
	translateAlways: type.boolean,
});

export const setSitePreferencesFactory: RequestHandlerFactory = () => {
	addRequestHandler('setSitePreferences', async (rawData) => {
		const { site, ...sitePrefs } = tryDecode(setSitePreferencesIn, rawData);

		await setPreferences(site, sitePrefs);
	});
};
