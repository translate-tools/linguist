import { type } from '../../../../lib/types';
import { buildBackendRequest } from '../../../utils/requestBuilder';

import { dataSignature, getPreferences } from './utils';

export const [getSitePreferencesFactory, getSitePreferencesReq] = buildBackendRequest(
	'getSitePreferences',
	{
		requestValidator: type.string,
		responseValidator: type.union([dataSignature, type.null]),

		factoryHandler: () => getPreferences,
	},
);

export const getSitePreferences = (site: string) => getSitePreferencesReq(site);
