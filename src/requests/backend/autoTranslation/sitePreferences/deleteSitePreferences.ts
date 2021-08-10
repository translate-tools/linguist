import { addRequestHandler, bgSendRequest } from '../../../../lib/communication';
import { tryDecode, type } from '../../../../lib/types';
import { RequestHandlerFactory } from '../../../types';

import { deletePreferences } from './utils';

export const deleteSitePreferences = (site: string): Promise<void> =>
	bgSendRequest('deleteSitePreferences', { site });

const deleteSitePreferencesIn = type.type({
	site: type.string,
});

export const deleteSitePreferencesFactory: RequestHandlerFactory = () => {
	addRequestHandler('deleteSitePreferences', async (rawData) => {
		const { site } = tryDecode(deleteSitePreferencesIn, rawData);
		await deletePreferences(site);
	});
};
