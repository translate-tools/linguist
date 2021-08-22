import { buildBackendRequest } from '../../../../lib/requests/requestBuilder';
import { type } from '../../../../lib/types';

import { deletePreferences } from './utils';

export const [deleteSitePreferencesFactory, deleteSitePreferencesReq] =
	buildBackendRequest('deleteSitePreferences', {
		requestValidator: type.string,

		factoryHandler: () => deletePreferences,
	});

export const deleteSitePreferences = (site: string) => deleteSitePreferencesReq(site);
