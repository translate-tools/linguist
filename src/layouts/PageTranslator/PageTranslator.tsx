import React, { FC, useCallback, useMemo } from 'react';
import { cn } from '@bem-react/classname';

import { Button } from '../../components/Button/Button.bundle/desktop';
import { Select } from '../../components/Select/Select.bundle/desktop';
import { LanguagePanel } from '../../components/LanguagePanel/LanguagePanel';

import { getMessage } from '../../lib/language';
import { MutableValue } from '../../types/utils';

import { TabData } from '../../pages/popup/layout/PopupWindow';
import { PageTranslateState } from '../../modules/PageTranslator/PageTranslator';

import './PageTranslator.css';
import { Spoiler } from '../../components/Spoiler/Spoiler.bundle/desktop';

export const cnPageTranslator = cn('PageTranslator');

export const languagePreferenceOptions = {
	ENABLE: 'enable',
	DISABLE: 'disable',
	DISABLE_FOR_ALL: 'disableForAll',
} as const;

export const sitePreferenceOptions = {
	DEFAULT: 'default',
	ALWAYS: 'always',
	NEVER: 'never',
	DEFAULT_FOR_THIS_LANGUAGE: 'defaultForThisLang',
	ALWAYS_FOR_THIS_LANGUAGE: 'alwaysForThisLang',
	NEVER_FOR_THIS_LANGUAGE: 'neverForThisLang',
} as const;

export interface PageTranslatorProps
	extends MutableValue<'from', string | undefined>,
		MutableValue<'to', string | undefined>,
		MutableValue<'isShowOptions', boolean>,
		// TODO: use literals
		MutableValue<'sitePreferences', string>,
		MutableValue<'languagePreferences', string> {
	/**
	 * Features of translator module
	 */
	translatorFeatures: TabData['translatorFeatures'];

	hostname: string;

	showCounters?: boolean;

	isTranslated: boolean;

	toggleTranslate: () => void;

	counters: PageTranslateState;
}

/**
 * Component represent UI for translate current page
 */
export const PageTranslator: FC<PageTranslatorProps> = ({
	translatorFeatures,
	from,
	setFrom,
	to,
	setTo,
	hostname,
	sitePreferences,
	setSitePreferences,
	languagePreferences,
	setLanguagePreferences,
	showCounters,
	toggleTranslate,
	isTranslated,
	counters,

	isShowOptions,
	setIsShowOptions,
}) => {
	const actionBtnText = getMessage(
		isTranslated ? 'pageTranslator_showOriginal' : 'pageTranslator_translatePage',
	);

	const escapedHostname = useMemo(
		() => (hostname.length <= 50 ? hostname : hostname.slice(0, 80) + '...'),
		[hostname],
	);
	const localizedLang = useMemo(
		() => getMessage(from === 'auto' ? 'lang_detect' : 'langCode_' + from),
		[from],
	);

	// TODO: #important fix types in library to allow set types strict
	const setTranslateLangAdaptor = useCallback(
		(value: string[] | string | undefined) => {
			// TODO: check that it is const value
			if (typeof value === 'string') {
				setLanguagePreferences(value);
			}
		},
		[setLanguagePreferences],
	);

	const setTranslateStateAdaptor = useCallback(
		(value: string[] | string | undefined) => {
			if (typeof value === 'string') {
				setSitePreferences(value);
			}
		},
		[setSitePreferences],
	);

	const translateLanguageOptions = useMemo(
		() =>
			[
				languagePreferenceOptions.ENABLE,
				languagePreferenceOptions.DISABLE,
				languagePreferenceOptions.DISABLE_FOR_ALL,
			].map((key) => ({
				id: key,
				content: getMessage(
					'pageTranslator_commonPreferences_autoTranslate_' + key,
				),
			})),
		[],
	);

	const translateSiteOptions = useMemo(
		() =>
			[
				sitePreferenceOptions.DEFAULT,
				sitePreferenceOptions.NEVER,
				sitePreferenceOptions.ALWAYS,
				sitePreferenceOptions.DEFAULT_FOR_THIS_LANGUAGE,
				sitePreferenceOptions.ALWAYS_FOR_THIS_LANGUAGE,
				sitePreferenceOptions.NEVER_FOR_THIS_LANGUAGE,
			].map((key) => ({
				id: key,
				content: getMessage(
					'pageTranslator_sitePreferences_autoTranslate_' + key,
				),
			})),
		[],
	);

	return (
		<div className={cnPageTranslator()}>
			<div
				className={cnPageTranslator('Direction')}
				style={{ marginBottom: '1rem' }}
			>
				<Button view="action" onPress={toggleTranslate}>
					{actionBtnText}
				</Button>{' '}
				<LanguagePanel
					auto={translatorFeatures.isSupportAutodetect}
					languages={translatorFeatures.supportedLanguages}
					from={from}
					to={to}
					setFrom={setFrom}
					setTo={setTo}
				/>
			</div>

			<Spoiler
				title={getMessage('pageTranslator_showOptions')}
				open={isShowOptions}
				onToggle={setIsShowOptions}
			>
				{/* TODO: use classes for styles */}
				<div>
					<h4
						className={cnPageTranslator('Header')}
						style={{ marginBottom: '.4rem', marginTop: '1rem' }}
					>
						{getMessage('pageTranslator_commonPreferences_title') +
							` (${localizedLang})`}
					</h4>
					<span style={{ marginRight: '.5rem' }}>
						{getMessage('pageTranslator_option_autoTranslate')}
					</span>
					<span style={{ marginRight: '.5rem' }}>
						<Select
							options={translateLanguageOptions}
							value={languagePreferences}
							setValue={setTranslateLangAdaptor}
						/>
					</span>
				</div>

				{/* TODO: use classes for styles */}
				<div>
					<h4
						className={cnPageTranslator('Header')}
						style={{ marginBottom: '.4rem', marginTop: '1rem' }}
					>
						{getMessage('pageTranslator_sitePreferences_title')}{' '}
						{escapedHostname}
					</h4>
					<span style={{ marginRight: '.5rem' }}>
						{getMessage('pageTranslator_option_autoTranslate')}
					</span>
					<span style={{ marginRight: '.5rem' }}>
						<Select
							options={translateSiteOptions}
							value={sitePreferences}
							setValue={setTranslateStateAdaptor}
						/>
					</span>
				</div>
			</Spoiler>

			{showCounters ? (
				<>
					<h4 className={cnPageTranslator('Header')}>
						{getMessage('pageTranslator_translationReport')}
					</h4>
					<div className={cnPageTranslator('CounterContainer')}>
						<span className={cnPageTranslator('Counter')}>
							{getMessage('pageTranslator_translationReport_resolve')}
							<span className={cnPageTranslator('CounterContent')}>
								{counters !== undefined ? counters.resolved : 0}
							</span>
						</span>
						<span className={cnPageTranslator('Counter')}>
							{getMessage('pageTranslator_translationReport_reject')}
							<span className={cnPageTranslator('CounterContent')}>
								{counters !== undefined ? counters.rejected : 0}
							</span>
						</span>
						<span className={cnPageTranslator('Counter')}>
							{getMessage('pageTranslator_translationReport_queue')}
							<span className={cnPageTranslator('CounterContent')}>
								{counters !== undefined ? counters.pending : 0}
							</span>
						</span>
					</div>
				</>
			) : (
				// Placeholder
				<div style={{ marginBottom: '.5rem' }} />
			)}
		</div>
	);
};
