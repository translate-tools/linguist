import { initReactI18next } from 'react-i18next';
import { createInstance, type ResourceKey } from 'i18next';

export type i18nContext = {
	lang: string;
	// Translations for a single language, keyed by namespace
	resources: Record<string, ResourceKey>;

	/**
	 * Alt versions of current page
	 */
	altVersions: {
		url: string;
		langCode: string;
		langName: string;
	}[];
};

export function createI18nInstance(
	lang: string,
	// Translations for a single language, keyed by namespace
	resources: Record<string, ResourceKey>,
) {
	const instance = createInstance();

	instance.use(initReactI18next).init({
		lng: lang,
		fallbackLng: 'en',
		resources: {
			// Shape expected by i18next: { [lang]: { [ns]: translations } }
			[lang]: resources,
		},
		interpolation: { escapeValue: false },
		react: {
			transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'wbr'],
		},
	});

	return instance;
}
