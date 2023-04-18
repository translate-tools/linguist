import { RecordValues } from '../../../../../types/utils';

import { languagePreferenceOptions, sitePreferenceOptions } from '../PageTranslator';
import { SitePrefs } from '../PageTranslator@tab';

/**
 * Convert site preferences for `lang` to string
 *
 * It need to generate UI from preferences
 */
export const getTranslatePreferencesForSite = (
	lang: string,
	sitePreferences: SitePrefs,
) => {
	// Set default
	let translatePreference: RecordValues<typeof sitePreferenceOptions> =
		sitePreferenceOptions.DEFAULT;

	if (sitePreferences !== null) {
		// Set default for site
		translatePreference = sitePreferenceOptions.DEFAULT_FOR_THIS_LANGUAGE;

		if (!sitePreferences.enableAutoTranslate) {
			translatePreference = sitePreferenceOptions.NEVER;
		} else if (
			sitePreferences.autoTranslateIgnoreLanguages.length === 0 &&
			sitePreferences.autoTranslateLanguages.length === 0
		) {
			translatePreference = sitePreferenceOptions.ALWAYS;
		} else {
			const isAutoTranslatedLang =
				sitePreferences.autoTranslateLanguages.indexOf(lang) !== -1;
			const isIgnoredLang =
				sitePreferences.autoTranslateIgnoreLanguages.indexOf(lang) !== -1;

			if (isIgnoredLang) {
				translatePreference = sitePreferenceOptions.NEVER_FOR_THIS_LANGUAGE;
			} else if (isAutoTranslatedLang) {
				translatePreference = sitePreferenceOptions.ALWAYS_FOR_THIS_LANGUAGE;
			}
		}
	}

	return translatePreference;
};

/**
 * Decide is require translate for `lang` by state of `sitePreferences`
 *
 * Return `boolean` with precision result or `null` for default behavior
 */
export const isRequireTranslateBySitePreferences = (
	lang: string,
	sitePreferences: SitePrefs,
) => {
	const result = getTranslatePreferencesForSite(lang, sitePreferences);

	switch (result) {
		case sitePreferenceOptions.NEVER:
		case sitePreferenceOptions.NEVER_FOR_THIS_LANGUAGE:
			return false;
		case sitePreferenceOptions.ALWAYS:
		case sitePreferenceOptions.ALWAYS_FOR_THIS_LANGUAGE:
			return true;
		default:
			return null;
	}
};

/**
 * Convert language preferences to const value of `languagePreferenceOptions`
 */
export const mapLanguagePreferences = (state: boolean | null) =>
	state === null
		? languagePreferenceOptions.DISABLE
		: state
			? languagePreferenceOptions.ENABLE
			: languagePreferenceOptions.DISABLE_FOR_ALL;
