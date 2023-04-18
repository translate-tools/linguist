import { type } from '../../../../lib/types';
import { buildBackendRequest } from '../../../utils/requestBuilder';

import { deletePreferences } from './utils';

export const [deleteSitePreferencesFactory, deleteSitePreferencesReq] =
	buildBackendRequest('deleteSitePreferences', {
		requestValidator: type.string,

		factoryHandler: () => deletePreferences,
	});

export const deleteSitePreferences = (site: string) => deleteSitePreferencesReq(site);
