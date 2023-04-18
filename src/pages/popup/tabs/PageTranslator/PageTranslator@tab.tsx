import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { PageTranslatorStats } from '../../../../app/ContentScript/PageTranslator/PageTranslator';
import { pageTranslatorStatsUpdatedHandler } from '../../../../app/ContentScript/PageTranslator/requests/pageTranslatorStatsUpdated';
import { getCurrentTab, getCurrentTabId } from '../../../../lib/browser/tabs';
import { useStateWithProxy } from '../../../../lib/hooks/useStateWithProxy';
// Requests
import { addLanguagePreferences } from '../../../../requests/backend/autoTranslation/languagePreferences/addLanguagePreferences';
import { deleteLanguagePreferences } from '../../../../requests/backend/autoTranslation/languagePreferences/deleteLanguagePreferences';
import { getLanguagePreferences } from '../../../../requests/backend/autoTranslation/languagePreferences/getLanguagePreferences';
import { deleteSitePreferences } from '../../../../requests/backend/autoTranslation/sitePreferences/deleteSitePreferences';
import { getSitePreferences } from '../../../../requests/backend/autoTranslation/sitePreferences/getSitePreferences';
import { setSitePreferences } from '../../../../requests/backend/autoTranslation/sitePreferences/setSitePreferences';
import { getPageLanguage } from '../../../../requests/contentscript/getPageLanguage';
import { disableTranslatePage } from '../../../../requests/contentscript/pageTranslation/disableTranslatePage';
import { enableTranslatePage } from '../../../../requests/contentscript/pageTranslation/enableTranslatePage';
import { getPageTranslateState } from '../../../../requests/contentscript/pageTranslation/getPageTranslateState';
import { InitFn, TabComponent } from '../../layout/PopupWindow';

import {
	languagePreferenceOptions,
	PageTranslator,
	sitePreferenceOptions,
} from './PageTranslator';
import { PageTranslationStorage } from './PageTranslator.utils/PageTranslationStorage';
import {
	getTranslatePreferencesForSite,
	mapLanguagePreferences,
} from './PageTranslator.utils/utils';

export type SitePrefs = ReturnType<typeof getSitePreferences> extends Promise<infer T>
	? T
	: never;

type InitData = {
	tabId: number;
	hostname: string;

	sitePreferences: SitePrefs;
	languagePreferences: string;
	sitePreferencesForLanguage: string;

	isTranslated: boolean;
	counters: PageTranslatorStats;
	direction: {
		from: string;
		to: string;
	};

	isShowOptions: boolean;
};

// TODO: review and refactor to simplify
/**
 * Wrapper on `PageTranslator` to use as tab in `PopupWindow`
 */
export const PageTranslatorTab: TabComponent<InitFn<InitData>> = ({
	config,
	translatorFeatures,
	initData,
	isMobile,
}) => {
	const {
		hostname,
		tabId,
		isTranslated: isTranslatedInit,
		counters: countersInit,
		direction: { from: initFrom, to: initTo },
	} = initData;

	// Define from/to
	const [from, setFrom] = useState<string | undefined>(initFrom);
	const [to, setTo] = useState<string | undefined>(initTo);

	const [sitePreferences, setSitePreferencesState] = useState<string>(
		initData.sitePreferencesForLanguage,
	);

	// Update `translateSite` by change `from`
	useEffect(() => {
		if (from === undefined) return;

		const actualPreference = getTranslatePreferencesForSite(
			from,
			initData.sitePreferences,
		);

		setSitePreferencesState(actualPreference);
	}, [from, initData.sitePreferences]);

	// Proxy for send requests by change `translateSite`
	const setSitePreferencesProxy: any = useCallback(
		(state: string) => {
			// Remember
			const newState: SitePrefs = initData.sitePreferences || {
				enableAutoTranslate: true,
				autoTranslateLanguages: [],
				autoTranslateIgnoreLanguages: [],
			};

			switch (state) {
				case sitePreferenceOptions.DEFAULT:
					// Delete entry and exit
					deleteSitePreferences(hostname);
					setSitePreferencesState(state);
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
						setSitePreferencesState(state);
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
			setSitePreferencesState(state);
		},
		[from, hostname, initData.sitePreferences],
	);

	// Define auto translate by language
	const [languagePreferences, setLanguagePreferencesState] = useState<string>(
		initData.languagePreferences,
	);

	// Update `translateLang` while update `from`
	useEffect(() => {
		if (from === undefined) {
			setLanguagePreferencesState(languagePreferenceOptions.DISABLE);
			return;
		}

		getLanguagePreferences(from).then((state) =>
			setLanguagePreferencesState(
				state === null
					? languagePreferenceOptions.DISABLE
					: state
						? languagePreferenceOptions.ENABLE
						: languagePreferenceOptions.DISABLE_FOR_ALL,
			),
		);
	}, [from]);

	const setLanguagePreferencesProxy: any = useCallback(
		(state: string) => {
			setLanguagePreferencesState(state);

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
			enableTranslatePage(tabId, from, to)
				.then(() => setIsTranslated(true))
				.catch(console.warn);
		} else {
			disableTranslatePage(tabId)
				.then(() => setIsTranslated(false))
				.catch(console.warn);
		}
	}, [from, isTranslated, tabId, to]);

	// Define counters
	const [counters, setCounters] = useState<PageTranslatorStats>(countersInit);
	useEffect(() => {
		// Handle updates
		pageTranslatorStatsUpdatedHandler((counters, messageTabId) => {
			// Skip messages from other tabs
			if (messageTabId !== tabId) return;

			setCounters(counters);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const pageTranslationStorage = useMemo(() => new PageTranslationStorage(), []);
	const [isShowOptions, setIsShowOptions] = useStateWithProxy<boolean>(
		initData.isShowOptions,
		(state, setState) => {
			// Update data
			if (typeof state !== 'function') {
				pageTranslationStorage.updateData({ optionsSpoilerState: !!state });
			}

			setState(state);
		},
	);

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
				sitePreferences,
				setSitePreferences: setSitePreferencesProxy,
				languagePreferences,
				setLanguagePreferences: setLanguagePreferencesProxy,

				isShowOptions,
				setIsShowOptions,

				isMobile,
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
	const sitePreferences = await getSitePreferences(hostname);

	// Get tab id
	const tabId = await getCurrentTabId();

	// Get state
	const { isTranslated, counters, translateDirection } = await getPageTranslateState(
		tabId,
	);

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

	// Set preferences for host and for language
	const sitePreferencesForLanguage = getTranslatePreferencesForSite(
		from,
		sitePreferences,
	);
	const languagePreferences = await getLanguagePreferences(from).then(
		mapLanguagePreferences,
	);

	const pageTranslationStorage = new PageTranslationStorage();
	const isShowOptions = await pageTranslationStorage
		.getData()
		.then((data) => data.optionsSpoilerState);

	return {
		tabId,
		hostname,

		sitePreferences,
		languagePreferences,
		sitePreferencesForLanguage,

		isTranslated,
		counters,
		direction: {
			from,
			to,
		},

		isShowOptions,
	};
};
