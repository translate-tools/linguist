import { buildBackendRequest } from '../../../../lib/requestBuilder';
import { type } from '../../../../lib/types';

import { setPreferences, dataSignature, SiteData } from './utils';

export const [setSitePreferencesFactory, setSitePreferencesReq] = buildBackendRequest(
	'setSitePreferences',
	{
		requestValidator: type.type({
			site: type.string,
			options: dataSignature,
		}),

		factoryHandler:
			() =>
				({ site, options }) =>
					setPreferences(site, options),
	},
);

export const setSitePreferences = (site: string, data: SiteData) =>
	setSitePreferencesReq({ site, options: data });
