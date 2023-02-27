import { buildBackendRequest } from '../../utils/requestBuilder';
import { type } from '../../../lib/types';
import { pushLanguage } from '.';

export const [pickLanguageFactory, pickLanguage] = buildBackendRequest('pickLanguage', {
	requestValidator: type.string,

	factoryHandler: () => async (language) => {
		return pushLanguage(language);
	},
});
