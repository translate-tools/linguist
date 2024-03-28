// Request handlers
import { addLanguagePreferencesFactory } from '../../requests/backend/autoTranslation/languagePreferences/addLanguagePreferences';
import { deleteLanguagePreferencesFactory } from '../../requests/backend/autoTranslation/languagePreferences/deleteLanguagePreferences';
import { getLanguagePreferencesFactory } from '../../requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
import { deleteSitePreferencesFactory } from '../../requests/backend/autoTranslation/sitePreferences/deleteSitePreferences';
import { getSitePreferencesFactory } from '../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
// Auto translation
import { setSitePreferencesFactory } from '../../requests/backend/autoTranslation/sitePreferences/setSitePreferences';
import { clearCacheFactory } from '../../requests/backend/clearCache';
import { getConfigFactory } from '../../requests/backend/getConfig';
import { getTranslatorFeaturesFactory } from '../../requests/backend/getTranslatorFeatures';
import { getUserLanguagePreferencesFactory } from '../../requests/backend/getUserLanguagePreferences';
import { historyRequestHandlersFactory } from '../../requests/backend/history';
import { pingFactory } from '../../requests/backend/ping';
import { addRecentUsedLanguageFactory } from '../../requests/backend/recentUsedLanguages/addRecentUsedLanguage';
import { getRecentUsedLanguagesFactory } from '../../requests/backend/recentUsedLanguages/getRecentUsedLanguages';
import { resetConfigFactory } from '../../requests/backend/resetConfig';
import { setConfigFactory } from '../../requests/backend/setConfig';
import { suggestLanguageFactory } from '../../requests/backend/suggestLanguage';
import { translateFactory } from '../../requests/backend/translate';
import { addTranslationFactory } from '../../requests/backend/translations/addTranslation';
import { clearTranslationsFactory } from '../../requests/backend/translations/clearTranslations';
import { deleteTranslationFactory } from '../../requests/backend/translations/deleteTranslation';
import { findTranslationFactory } from '../../requests/backend/translations/findTranslation';
import { getTranslationsFactory } from '../../requests/backend/translations/getTranslations';
import { addTranslatorFactory } from '../../requests/backend/translators/addTranslator';
import { applyTranslatorsFactory } from '../../requests/backend/translators/applyTranslators';
import { deleteTranslatorFactory } from '../../requests/backend/translators/deleteTranslator';
import { getAvailableTranslatorsFactory } from '../../requests/backend/translators/getAvailableTranslators';
import { getTranslatorsFactory } from '../../requests/backend/translators/getTranslators';
import { updateTranslatorFactory } from '../../requests/backend/translators/updateTranslator';
import { ttsRequestHandlers } from '../../requests/backend/tts';
import { updateConfigFactory } from '../../requests/backend/updateConfig';

export const requestHandlers = [
	translateFactory,
	suggestLanguageFactory,
	getTranslatorFeaturesFactory,
	getUserLanguagePreferencesFactory,
	getAvailableTranslatorsFactory,
	clearCacheFactory,

	...ttsRequestHandlers,

	historyRequestHandlersFactory,

	getConfigFactory,
	setConfigFactory,
	resetConfigFactory,
	updateConfigFactory,

	getLanguagePreferencesFactory,
	addLanguagePreferencesFactory,
	deleteLanguagePreferencesFactory,
	setSitePreferencesFactory,
	getSitePreferencesFactory,
	deleteSitePreferencesFactory,

	addTranslationFactory,
	deleteTranslationFactory,
	findTranslationFactory,
	getTranslationsFactory,
	clearTranslationsFactory,

	addTranslatorFactory,
	deleteTranslatorFactory,
	updateTranslatorFactory,
	getTranslatorsFactory,
	applyTranslatorsFactory,

	getRecentUsedLanguagesFactory,
	addRecentUsedLanguageFactory,

	// Up ping last to give success response only when all request handlers is ready
	pingFactory,
];
