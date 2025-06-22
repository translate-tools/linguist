import { detectLanguage } from '../../lib/language';

import { buildBackendRequest } from '../utils/requestBuilder';

// TODO: use method of current translator
export const [suggestLanguageFactory, suggestLanguage] = buildBackendRequest(
	'suggestLanguage',
	{ factoryHandler: () => (language: string) => detectLanguage(language) },
);
