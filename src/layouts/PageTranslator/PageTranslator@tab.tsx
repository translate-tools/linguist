import React, { useCallback, useEffect, useState } from 'react';

import { getCurrentTab, getCurrentTabId } from '../../lib/communication';
import { PageTranslateState } from '../../modules/PageTranslator/PageTranslator';
import { translateStateUpdateHandler } from '../../modules/PageTranslator/requests';

// Requests
import { addAutoTranslatedLang } from '../../requests/backend/autoTranslation/autoTranslatedLangs/addAutoTranslatedLang';
import { deleteAutoTranslatedLang } from '../../requests/backend/autoTranslation/autoTranslatedLangs/deleteAutoTranslatedLang';
import { hasAutoTranslatedLang } from '../../requests/backend/autoTranslation/autoTranslatedLangs/hasAutoTranslatedLang';
import { getSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { setSitePreferences } from '../../requests/backend/autoTranslation/sitePreferences/setSitePreferences';
import { getPageLanguage } from '../../requests/contentscript/getPageLanguage';
import { getTranslateState } from '../../requests/contentscript/getTranslateState';
import { translatePage } from '../../requests/contentscript/translatePage';
import { untranslatePage } from '../../requests/contentscript/untranslatePage';

import { InitFn, TabComponent } from '../../pages/popup/layout/PopupWindow';
import { PageTranslator, sitePreferenceOptions } from './PageTranslator';
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

export const getTranslatePreferencesForSite = (lang: string, sitePrefs: SitePrefs) => {
	let translateSite: RecordValue<typeof sitePreferenceOptions> =
		sitePreferenceOptions.default;
	if (sitePrefs !== null) {
		if (!sitePrefs.enableAutoTranslate) {
			translateSite = sitePreferenceOptions.never;
		} else if (
			sitePrefs.autoTranslateIgnoreLanguages.length === 0 &&
			sitePrefs.autoTranslateLanguages.length === 0
		) {
			translateSite = sitePreferenceOptions.always;
		} else {
			const isAutoTranslatedLang =
				sitePrefs.autoTranslateLanguages.indexOf(lang) !== -1;
			const isIgnoredLang =
				sitePrefs.autoTranslateIgnoreLanguages.indexOf(lang) !== -1;

			if (isIgnoredLang) {
				translateSite = sitePreferenceOptions.neverForThisLang;
			} else if (isAutoTranslatedLang) {
				translateSite = sitePreferenceOptions.alwaysForThisLang;
			}
		}
	}

	return translateSite;
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

	const setTranslateSiteProxy: any = useCallback(
		(state: string) => {
			// Remember
			const newState: SitePrefs = sitePrefs || {
				enableAutoTranslate: true,
				autoTranslateLanguages: [],
				autoTranslateIgnoreLanguages: [],
			};

			switch (state) {
			case sitePreferenceOptions.default:
				// Delete entry and exit
				deleteSitePreferences(hostname);
				setTranslateSite(state);
				return;
			case sitePreferenceOptions.always:
				newState.enableAutoTranslate = true;
				newState.autoTranslateLanguages = [];
				newState.autoTranslateIgnoreLanguages = [];
				break;
			case sitePreferenceOptions.never:
				newState.enableAutoTranslate = false;
				newState.autoTranslateLanguages = [];
				break;
			case sitePreferenceOptions.alwaysForThisLang:
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
			case sitePreferenceOptions.neverForThisLang:
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
	const [translateLang, setTranslateLang] = useState(false);

	// Update `translateLang` while update `from`
	useEffect(() => {
		if (from === undefined) {
			setTranslateLang(false);
			return;
		}

		hasAutoTranslatedLang(from).then(setTranslateLang);
	}, [from]);

	const setTranslateLangProxy: any = useCallback(
		(state: boolean) => {
			setTranslateLang(state);

			if (from === undefined) return;

			// Remember
			(async () => {
				if (state) {
					addAutoTranslatedLang(from);
				} else {
					deleteAutoTranslatedLang(from);
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
