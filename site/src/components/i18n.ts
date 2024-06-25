import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import resourcesToBackend from 'i18next-resources-to-backend';

import defaultLanguageNsLanding from './Landing/locales/en.json';

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(ChainedBackend)
	.use(LanguageDetector)
	.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		fallbackLng: 'en',
		backend: {
			backends: [
				resourcesToBackend((lng) => import(`./Landing/locales/${lng}.json`)),
			],
		},
		interpolation: {
			escapeValue: false, // react already safes from xss
		},
	});

i18n.addResourceBundle('en', 'landing', defaultLanguageNsLanding);

export default i18n;
