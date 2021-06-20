import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getCurrentTab, getCurrentTabId } from '../../lib/communication';
import { PageTranslateState } from '../../modules/PageTranslator/PageTranslator';
import { translateStateUpdateHandler } from '../../modules/PageTranslator/requests';
import { TabComponent } from '../../pages/popup/layout/PopupWindow';

// Requests
import { getAutoTranslatedLangs } from '../../requests/backend/autoTranslatedLangs/getAutoTranslatedLangs';
import { setAutoTranslatedLangs } from '../../requests/backend/autoTranslatedLangs/setAutoTranslatedLangs';
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
	autoTranslatedLangs: string[];

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
		autoTranslatedLangs,
		tabId,
		isTranslated: isTranslatedInit,
		counters: countersInit,
	} = initData;

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
	const isTranslateHostname = sitePrefs === null ? false : sitePrefs.translateAlways;
	const [translateSite, setTranslateSite] = useState(isTranslateHostname);

	const setTranslateSiteProxy: any = useCallback(
		(state: boolean) => {
			// Remember
			setSitePreferences(hostname, { translateAlways: state });
			setTranslateSite(state);
		},
		[hostname],
	);

	// Define auto translate by language
	const autoTranslatedLangsRef = useRef(autoTranslatedLangs);
	const [translateLang, setTranslateLang] = useState(
		from !== undefined && autoTranslatedLangsRef.current.indexOf(from) !== -1,
	);

	// Update after load
	useEffect(() => {
		setTranslateLang(
			from !== undefined && autoTranslatedLangsRef.current.indexOf(from) !== -1,
		);
	}, [from]);

	const setTranslateLangProxy: any = useCallback(
		(state: boolean) => {
			setTranslateLang(state);

			// Remember
			if (from === undefined) return;
			(async () => {
				autoTranslatedLangsRef.current = await getAutoTranslatedLangs();

				if (state) {
					if (autoTranslatedLangsRef.current.indexOf(from) === -1) {
						const newLangsList = autoTranslatedLangsRef.current.concat(from);
						setAutoTranslatedLangs(newLangsList);
					}
				} else {
					const newLangsList = autoTranslatedLangsRef.current.filter(
						(lang) => lang !== from,
					);
					if (autoTranslatedLangsRef.current.length !== newLangsList.length) {
						setAutoTranslatedLangs(newLangsList);
					}
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
	const autoTranslatedLangs = await getAutoTranslatedLangs();

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
		autoTranslatedLangs,

		tabId,
		isTranslated,
		counters,
		direction: {
			from,
			to,
		},
	};
};
