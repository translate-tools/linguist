import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentTab, getCurrentTabId } from '../../lib/communication';
import { PageTranslateState } from '../../modules/PageTranslator/PageTranslator';
import { translateStateUpdateHandler } from '../../modules/PageTranslator/requests';
import { TabComponent } from '../../pages/popup/layout/PopupWindow';

// Requests
import { addAutoTranslatedLang } from '../../requests/backend/autoTranslatedLangs/addAutoTranslatedLang';
import { deleteAutoTranslatedLang } from '../../requests/backend/autoTranslatedLangs/deleteAutoTranslatedLang';
import { hasAutoTranslatedLang } from '../../requests/backend/autoTranslatedLangs/hasAutoTranslatedLang';
import { getSitePreferences } from '../../requests/backend/sitePreferences/getSitePreferences';
import { setSitePreferences } from '../../requests/backend/sitePreferences/setSitePreferences';
import { getPageLanguage } from '../../requests/contentscript/getPageLanguage';
import { getTranslateState } from '../../requests/contentscript/getTranslateState';
import { translatePage } from '../../requests/contentscript/translatePage';
import { untranslatePage } from '../../requests/contentscript/untranslatePage';

import { PageTranslator } from './PageTranslator';

type initData = {
	hostname: string;
	sitePrefs: ReturnType<typeof getSitePreferences> extends Promise<infer T> ? T : never;

	tabId: number;
	isTranslated: boolean;
	counters: PageTranslateState;
	direction: {
		from: string | null;
		to: string | null;
	};
};

/**
 * Wrapper on `PageTranslator` to use as tab in `PopupWindow`
 */
export const PageTranslatorTab: TabComponent<initData> = ({
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
	} = initData;

	// TODO: refactor it
	// - Move init data to init static member
	// - Remove `translatorFeatures` if it unnecessary
	// - Use context as shared cache if fetch `translatorFeatures` for each tab is too long
	// Init state
	const initStateData = useRef<Record<string, string>>();
	if (!initStateData.current) {
		initStateData.current = {
			from:
				initData.direction.from ||
				(translatorFeatures.isSupportAutodetect
					? 'auto'
					: translatorFeatures.supportedLanguages[0]),
			to: initData.direction.to || config.language,
		};
	}

	// Define from/to
	const [from, setFrom] = useState<string | undefined>(initStateData.current.from);
	const [to, setTo] = useState<string | undefined>(initStateData.current.to);

	// Define auto translate by hostname
	const isTranslateHostname =
		sitePrefs === null ? false : sitePrefs.enableAutoTranslate;
	const [translateSite, setTranslateSite] = useState(isTranslateHostname);

	const setTranslateSiteProxy: any = useCallback(
		(state: boolean) => {
			// Remember
			const newState = sitePrefs || {
				enableAutoTranslate: state,
				autoTranslateLanguages: [],
			};

			// TODO: use something like `updateSitePreferences` instead set full data
			setSitePreferences(hostname, { ...newState, enableAutoTranslate: state });
			setTranslateSite(state);
		},
		[hostname, sitePrefs],
	);

	// TODO: Preload it
	// Define auto translate by language
	const [translateLang, setTranslateLang] = useState(false);

	// Update `translateLang` while update `from`
	useEffect(() => {
		if (from === undefined) {
			setTranslateLang(false);
			return;
		}

		hasAutoTranslatedLang(from).then((lang) => {
			console.warn('Is from auto', lang);
			setTranslateLang(lang);
		});
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

PageTranslatorTab.init = async (): Promise<initData> => {
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

	if (translateDirection !== null) {
		from = translateDirection.from;
		to = translateDirection.to;
	}

	// Set page language as "from"
	if (!isTranslated) {
		from = await getPageLanguage(tabId);
	}

	return {
		hostname,
		sitePrefs,

		tabId,
		isTranslated,
		counters,
		direction: {
			from,
			to,
		},
	};
};
