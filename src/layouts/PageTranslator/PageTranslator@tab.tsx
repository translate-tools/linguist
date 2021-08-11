import React, { useCallback, useEffect, useState } from 'react';

import { getCurrentTab, getCurrentTabId } from '../../lib/communication';
import { PageTranslateState } from '../../modules/PageTranslator/PageTranslator';
import { translateStateUpdateHandler } from '../../modules/PageTranslator/requests';

// Requests
import { addLanguagePreferences } from '../../requests/backend/autoTranslation/languagePreferences/addLanguagePreferences';
import { deleteLanguagePreferences } from '../../requests/backend/autoTranslation/languagePreferences/deleteLanguagePreferences';
import { getLanguagePreferences } from '../../requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
import { getSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { setSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/setSitePreferences';
import { getPageLanguage } from '../../requests/contentscript/getPageLanguage';
import { getTranslateState } from '../../requests/contentscript/getTranslateState';
import { translatePage } from '../../requests/contentscript/translatePage';
import { untranslatePage } from '../../requests/contentscript/untranslatePage';

import { InitFn, TabComponent } from '../../pages/popup/layout/PopupWindow';
import {
	languagePreferenceOptions,
	PageTranslator,
	sitePreferenceOptions,
} from './PageTranslator';
import { deleteSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/deleteSitePreferences';

type SitePrefs = ReturnType<typeof getSitePreferences> extends Promise<infer T>
	? T
	: never;
type InitData = {
	hostname: string;
	sitePrefs: SitePrefs;

	translateSite: string;
	tabId: number;
	isTranslated: boolean;
	counters: PageTranslateState;
	direction: {
		from: string;
		to: string;
	};
};

// TODO: move it to lib
type RecordValue<T extends Record<any, string>> = keyof {
	[K in keyof T as T[K]]: any;
};

// TODO: comment this and move to requests or to main component
export const getTranslatePreferencesForSite = (lang: string, sitePrefs: SitePrefs) => {
	// Set default
	let translatePreference: RecordValue<typeof sitePreferenceOptions> =
		sitePreferenceOptions.DEFAULT;

	if (sitePrefs !== null) {
		// Set default for site
		translatePreference = sitePreferenceOptions.DEFAULT_FOR_THIS_LANGUAGE;

		if (!sitePrefs.enableAutoTranslate) {
			translatePreference = sitePreferenceOptions.NEVER;
		} else if (
			sitePrefs.autoTranslateIgnoreLanguages.length === 0 &&
			sitePrefs.autoTranslateLanguages.length === 0
		) {
			translatePreference = sitePreferenceOptions.ALWAYS;
		} else {
			const isAutoTranslatedLang =
				sitePrefs.autoTranslateLanguages.indexOf(lang) !== -1;
			const isIgnoredLang =
				sitePrefs.autoTranslateIgnoreLanguages.indexOf(lang) !== -1;

			if (isIgnoredLang) {
				translatePreference = sitePreferenceOptions.NEVER_FOR_THIS_LANGUAGE;
			} else if (isAutoTranslatedLang) {
				translatePreference = sitePreferenceOptions.ALWAYS_FOR_THIS_LANGUAGE;
			}
		}
	}

	return translatePreference;
};

export const isRequireTranslateBySitePreferences = (
	lang: string,
	sitePrefs: SitePrefs,
) => {
	const result = getTranslatePreferencesForSite(lang, sitePrefs);

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
 * Wrapper on `PageTranslator` to use as tab in `PopupWindow`
 */
export const PageTranslatorTab: TabComponent<InitFn<InitData>> = ({
	config,
	translatorFeatures,
	initData,
}) => {
	if (initData === undefined) {
		throw Error(`Invalid init data`);
	}

	const {
		hostname,
		sitePrefs,
		tabId,
		isTranslated: isTranslatedInit,
		counters: countersInit,
		direction: { from: initFrom, to: initTo },
	} = initData;

	// Define from/to
	const [from, setFrom] = useState<string | undefined>(initFrom);
	const [to, setTo] = useState<string | undefined>(initTo);

	// TODO: rename it to `autoTranslateSitePreferences`
	const [translateSite, setTranslateSite] = useState<string>(initData.translateSite);

	// Update `translateSite` by change `from`
	useEffect(() => {
		if (from === undefined) return;

		const actualPreference = getTranslatePreferencesForSite(from, sitePrefs);

		setTranslateSite(actualPreference);
	}, [from, sitePrefs]);

	// Proxy for send requests by change `translateSite`
	const setTranslateSiteProxy: any = useCallback(
		(state: string) => {
			// Remember
			const newState: SitePrefs = sitePrefs || {
				enableAutoTranslate: true,
				autoTranslateLanguages: [],
				autoTranslateIgnoreLanguages: [],
			};

			// TODO: add option "default for this language" which will remove options for this language
			// but will not delete entry if it not empty
			switch (state) {
			case sitePreferenceOptions.DEFAULT:
				// Delete entry and exit
				deleteSitePreferences(hostname);
				setTranslateSite(state);
				return;
			case sitePreferenceOptions.DEFAULT_FOR_THIS_LANGUAGE:
				// Delete language from everywhere
				newState.autoTranslateLanguages =
						newState.autoTranslateLanguages.filter((lang) => lang !== from);

				newState.autoTranslateIgnoreLanguages =
						newState.autoTranslateIgnoreLanguages.filter(
							(lang) => lang !== from,
						);

				if (
					newState.autoTranslateLanguages.length === 0 &&
						newState.autoTranslateIgnoreLanguages.length === 0
				) {
					// Delete empty entry
					deleteSitePreferences(hostname);
					setTranslateSite(state);
					return;
				} else {
					// Break to write changes
					break;
				}
			case sitePreferenceOptions.ALWAYS:
				newState.enableAutoTranslate = true;
				newState.autoTranslateLanguages = [];
				newState.autoTranslateIgnoreLanguages = [];
				break;
			case sitePreferenceOptions.NEVER:
				newState.enableAutoTranslate = false;
				newState.autoTranslateLanguages = [];
				break;
			case sitePreferenceOptions.ALWAYS_FOR_THIS_LANGUAGE:
				// Skip invalid language
				if (from === undefined) break;

				// Enable auto translate
				newState.enableAutoTranslate = true;

				// Remove language if exist
				newState.autoTranslateIgnoreLanguages =
						newState.autoTranslateIgnoreLanguages.filter(
							(lang) => lang !== from,
						);

				// Add language if not exist
				if (!newState.autoTranslateLanguages.find((lang) => lang === from)) {
					newState.autoTranslateLanguages.push(from);
				}

				break;
			case sitePreferenceOptions.NEVER_FOR_THIS_LANGUAGE:
				// Skip invalid language
				if (from === undefined) break;

				// Remove language if exist
				newState.autoTranslateLanguages =
						newState.autoTranslateLanguages.filter((lang) => lang !== from);

				// Add language if not exist
				if (
					!newState.autoTranslateIgnoreLanguages.find(
						(lang) => lang === from,
					)
				) {
					newState.autoTranslateIgnoreLanguages.push(from);
				}
				break;

			default:
				console.error('Data for error below', state);
				throw new Error(`Unknown type for "translateSite"`);
			}

			// TODO: use something like `updateSitePreferences` instead set full data
			setSitePreferences(hostname, newState);
			setTranslateSite(state);
		},
		[from, hostname, sitePrefs],
	);

	// Define auto translate by language
	// TODO: preload it
	const [translateLang, setTranslateLang] = useState<string>(
		languagePreferenceOptions.DISABLE,
	);

	// Update `translateLang` while update `from`
	useEffect(() => {
		if (from === undefined) {
			setTranslateLang(languagePreferenceOptions.DISABLE);
			return;
		}

		getLanguagePreferences(from).then((state) =>
			setTranslateLang(
				state === null
					? languagePreferenceOptions.DISABLE
					: state
						? languagePreferenceOptions.ENABLE
						: languagePreferenceOptions.DISABLE_FOR_ALL,
			),
		);
	}, [from]);

	const setTranslateLangProxy: any = useCallback(
		(state: string) => {
			setTranslateLang(state);

			if (from === undefined) return;

			// Remember
			(async () => {
				switch (state) {
				case languagePreferenceOptions.ENABLE:
					addLanguagePreferences(from, true);
					break;

				case languagePreferenceOptions.DISABLE_FOR_ALL:
					addLanguagePreferences(from, false);
					break;

				case languagePreferenceOptions.DISABLE:
					deleteLanguagePreferences(from);
					break;

				default:
					console.error('Data for error below', state);
					throw new Error(`Unknown type for "translateLang"`);
				}
			})();
		},
		[from],
	);

	// Define toggle translate
	const [isTranslated, setIsTranslated] = useState(isTranslatedInit);
	const togglePageTranslate = useCallback(() => {
		if (
			tabId === undefined ||
			isTranslated === undefined ||
			from === undefined ||
			to === undefined
		)
			return;

		// TODO: handle errors
		if (!isTranslated) {
			translatePage(tabId, from, to)
				.then(() => setIsTranslated(true))
				.catch(console.warn);
		} else {
			untranslatePage(tabId)
				.then(() => setIsTranslated(false))
				.catch(console.warn);
		}
	}, [from, isTranslated, tabId, to]);

	// Define counters
	const [counters, setCounters] = useState<PageTranslateState>(countersInit);
	useEffect(() => {
		// Handle updates
		translateStateUpdateHandler((counters, messageTabId) => {
			// Skip messages from other tabs
			if (messageTabId !== tabId) return;

			setCounters(counters);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<PageTranslator
			translatorFeatures={translatorFeatures}
			showCounters={config.popupTab.pageTranslator.showCounters}
			toggleTranslate={togglePageTranslate}
			counters={counters}
			isTranslated={isTranslated}
			{...{
				from,
				setFrom,
				to,
				setTo,
				hostname,
				translateSite,
				setTranslateSite: setTranslateSiteProxy,
				translateLang,
				setTranslateLang: setTranslateLangProxy,
			}}
		/>
	);
};

PageTranslatorTab.init = async ({ translatorFeatures, config }): Promise<InitData> => {
	// Get current tab hostname
	const tab = await getCurrentTab();

	const pageUrl = tab.url;
	if (pageUrl === undefined) {
		throw Error(`Can't get access to tab URL`);
	}

	const url = new URL(pageUrl);
	const hostname = url.host;

	// Get site preferences
	const sitePrefs = await getSitePreferences(hostname);

	// Get tab id
	const tabId = await getCurrentTabId();

	// Get state
	const { isTranslated, counters, translateDirection } = await getTranslateState(tabId);

	let from: string | null = null;
	let to: string | null = null;

	// Set languages returned by translated page state
	if (translateDirection !== null) {
		from = translateDirection.from;
		to = translateDirection.to;
	}

	// Set page language as "from" if page is not in translation
	if (!isTranslated) {
		from = await getPageLanguage(tabId);
	}

	// Set default lang directions
	if (from === null) {
		from = translatorFeatures.isSupportAutodetect
			? 'auto'
			: translatorFeatures.supportedLanguages[0];
	}

	if (to === null) {
		to = config.language;
	}

	// Set `translateSite`
	const translateSite: string = getTranslatePreferencesForSite(from, sitePrefs);

	return {
		hostname,
		sitePrefs,

		translateSite,
		tabId,
		isTranslated,
		counters,
		direction: {
			from,
			to,
		},
	};
};
