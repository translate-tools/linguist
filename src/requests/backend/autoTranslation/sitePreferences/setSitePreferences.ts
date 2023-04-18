import { type } from '../../../../lib/types';
import { buildBackendRequest } from '../../../utils/requestBuilder';

import { dataSignature, setPreferences, SiteData } from './utils';

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
