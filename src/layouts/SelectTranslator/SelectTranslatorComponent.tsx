import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { browser } from 'webextension-polyfill-ts';

import { TranslatorFeatures } from '../../pages/popup/layout/PopupWindow';

import { detectLanguage, getMessage } from '../../lib/language';
import { useTranslateFavorite } from '../../lib/hooks/useTranslateFavorite';

import { getTranslatorFeatures } from '../../requests/backend/getTranslatorFeatures';
import { getLanguagePreferences } from '../../requests/backend/getLanguagePreferences';

// Components
import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';
// import { Textarea } from '../../components/Textarea/Textarea.bundle/desktop';
import { Button } from '../../components/Button/Button.bundle/desktop';
import { LanguagePanel } from '../../components/LanguagePanel/LanguagePanel';
import { Icon } from '../../components/Icon/Icon.bundle/desktop';
import { Loader } from '../../components/Loader/Loader';

import { cnSelectTranslator } from './SelectTranslator';
import './SelectTranslator.css';

export interface SelectTranslatorComponentProps {
	detectedLangFirst: boolean;
	rememberDirection: boolean;
	text: string;
	translate: (text: string, from: string, to: string) => Promise<string>;
	closeHandler: () => void;
	updatePopup: () => void;
	pageLanguage?: string;
	showOriginalText?: boolean;
}

// TODO: improve layout
// TODO: rename component and move to element dir
export const SelectTranslatorComponent: FC<SelectTranslatorComponentProps> = ({
	pageLanguage,
	detectedLangFirst,
	rememberDirection,
	text,
	closeHandler,
	translate,
	updatePopup,
	showOriginalText,
}) => {
	const [from, setFrom] = useState<string>();
	const [to, setTo] = useState<string>();
	const [translatorFeatures, setTranslatorFeatures] = useState<TranslatorFeatures>();

	const [originalText, setOriginalText] = useState<string>(text);
	const [translatedText, setTranslatedText] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const translateContext = useRef(Symbol('TranslateContext'));
	const translateText = useCallback(() => {
		// NOTE: maybe worth handle this error
		if (from === undefined || to === undefined) {
			throw Error(`Call to translate method with invalid direction: ${from}-${to}`);
		}

		translateContext.current = Symbol('TranslateContext');
		const context = translateContext.current;

		setTranslatedText(null);
		setError(null);

		translate(originalText, from, to)
			.then((translatedText) => {
				if (context !== translateContext.current) return;

				setTranslatedText(translatedText);
				setError(null);
			})
			.catch((reason) => {
				if (context !== translateContext.current) return;

				let error = 'Unknown error';
				if (typeof reason === 'string') {
					error = reason;
				} else if (reason instanceof Error) {
					error = reason.message;
				}

				setTranslatedText(null);
				setError(error);
			})
			.finally(() => {
				if (context !== translateContext.current) return;

				translateContext.current = Symbol('TranslateContext');
			});
	}, [from, originalText, to, translate]);

	const swapHandler = useCallback(
		({ from, to }: { from: string; to: string }) => {
			if (translatedText === null) return;

			console.warn('Switch', { to, from, translatedText });

			setFrom(from);
			setTo(to);
			setOriginalText(translatedText);
			setTranslatedText(null);
		},
		[translatedText],
	);

	// Favorite state
	const { isFavorite, toggleFavorite } = useTranslateFavorite({
		from,
		to,
		text: originalText,
		translate: translatedText,
	});

	const setIsFavoriteProxy = useCallback(
		(state: boolean) => {
			if (state === isFavorite) return;
			toggleFavorite();
		},
		[isFavorite, toggleFavorite],
	);

	// Init
	const isUnmount = useRef(false);
	useEffect(() => {
		getTranslatorFeatures().then(
			async ({ supportedLanguages, isSupportAutodetect }) => {
				const { userLanguage } = await getLanguagePreferences();

				let from: string | undefined;

				// Try recover last direction
				if (rememberDirection) {
					try {
						const lastFrom = await browser.storage.local
							.get('SelectTranslator')
							.then((store) => {
								const data = store?.SelectTranslator?.lastFrom;
								return typeof data === 'string' ? data : null;
							});

						if (
							lastFrom !== null &&
							((isSupportAutodetect && lastFrom == 'auto') ||
								supportedLanguages.indexOf(lastFrom)) !== -1
						) {
							from = lastFrom;
						}
					} catch (error) {
						console.error(error);
					}
				}

				// Set `from` language
				if (from === undefined) {
					// TODO: replace to option
					const isUseAutoForDetectLang = true;
					const detectedLanguage = await detectLanguage(originalText);

					const isValidLang = (lang: any): lang is string => {
						if (typeof lang !== 'string') return false;

						if (supportedLanguages.indexOf(lang) !== -1) return true;
						// TODO: rename `isSupportAutodetect` to `isSupportAutoDetect`
						if (lang === 'auto' && isSupportAutodetect) return true;

						return false;
					};

					// List of lang detectors which define language depends on config
					const langDetectors: {
						getLang: () => string | void;
						priority: number;
					}[] = [
						{
							// Detect language from text or use `auto` if support
							getLang() {
								console.warn('Detect 0');

								// Set detected lang if found
								if (detectedLanguage !== null) return detectedLanguage;

								// Set `auto` if support and enable
								if (isUseAutoForDetectLang && isSupportAutodetect)
									return 'auto';
							},
							priority: 0,
						},

						{
							// Set page lang if found
							getLang() {
								console.warn('Detect 1');

								if (pageLanguage !== undefined) return pageLanguage;
							},
							priority: 0,
						},

						{
							// Default value. Auto detect if supported, first lang otherwise
							getLang() {
								console.warn('Detect 2');

								return isSupportAutodetect
									? 'auto'
									: supportedLanguages[0];
							},
							priority: -1,
						},
					];

					// Set priority
					if (detectedLangFirst) {
						langDetectors[0].priority++;
					} else {
						langDetectors[1].priority++;
					}

					// Reverse sort by priority
					const sortedLangDetectors = langDetectors.sort(
						(x, y) => y.priority - x.priority,
					);

					// Select language
					for (const detector of sortedLangDetectors) {
						const selectedFromLang = detector.getLang();
						if (isValidLang(selectedFromLang)) {
							from = selectedFromLang;
							break;
						}
					}
				}

				// Check for cases when component did close very fast
				if (!isUnmount.current) {
					setTranslatorFeatures({
						supportedLanguages,
						isSupportAutodetect,
					});
					setFrom(from);
					setTo(userLanguage);
				}
			},
		);

		return () => {
			isUnmount.current = true;
			translateContext.current = Symbol('TranslateContext');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Set init state
	const [isInited, setIsInited] = useState(false);
	useEffect(() => {
		// Skip if already inited
		if (isInited) return;

		// Set inited
		if (from !== undefined && to !== undefined && translatorFeatures !== undefined) {
			setIsInited(true);
		}
	}, [isInited, from, to, translatorFeatures]);

	useEffect(() => {
		// Save direction
		if (rememberDirection && from !== undefined) {
			browser.storage.local
				.set({ SelectTranslator: { lastFrom: from } })
				.catch(console.error);
		}
	}, [from, rememberDirection]);

	useEffect(() => {
		// Wait init
		if (!isInited) return;
		translateText();
	}, [isInited, translateText, translatorFeatures]);

	useEffect(() => {
		if (updatePopup) updatePopup();
	});

	// Translate by update original text
	useEffect(() => {
		// Wait init
		if (!isInited) return;
		translateText();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isInited, originalText]);

	if (translatorFeatures !== undefined && (translatedText !== null || error !== null)) {
		return (
			<div className={cnSelectTranslator()}>
				<div
					className={cnSelectTranslator('Head', {}, [
						cnSelectTranslator('Clearfix'),
					])}
				>
					<div
						className={cnSelectTranslator('Container', {
							direction: 'left',
						})}
					>
						<LanguagePanel
							languages={translatorFeatures.supportedLanguages}
							auto={translatorFeatures.isSupportAutodetect}
							setFrom={setFrom}
							setTo={setTo}
							from={from}
							to={to}
							swapHandler={swapHandler}
							disableSwap={translatedText === null}
						/>{' '}
					</div>

					<div
						className={cnSelectTranslator('Container', {
							direction: 'right',
						})}
					>
						<Button
							view="clear"
							// `onPress` is not work in shadow DOM
							onPress={closeHandler}
							title={getMessage('common_close')}
							content="icon"
						>
							<Icon glyph="close" />
						</Button>
					</div>
				</div>
				<div className={cnSelectTranslator('Menu')}>
					<span>
						<Checkbox
							label={getMessage('common_action_addToDictionary')}
							checked={isFavorite}
							setChecked={setIsFavoriteProxy}
						/>
					</span>
				</div>
				{error === null ? (
					<>
						<div className={cnSelectTranslator('Body')}>{translatedText}</div>
						{!showOriginalText ? undefined : (
							<div className={cnSelectTranslator('OriginalTextContainer')}>
								<details onToggle={updatePopup}>
									<summary>
										{getMessage('inlineTranslator_showOriginalText')}
									</summary>
									<p className={cnSelectTranslator('OriginalText')}>
										{originalText}
									</p>

									{/* NOTE: it may be useful */}
									{/* <Textarea
									value={originalText}
									style={{ width: '100%', height: '' }}
									controlProps={{ style: { minHeight: '8rem' } }}
								/>
								<Button view="action">Translate</Button> */}
								</details>
							</div>
						)}
					</>
				) : (
					<>
						<div className={cnSelectTranslator('Body', { error: true })}>
							{error}
						</div>
						<div>
							<Button view="action" onPress={translateText}>
								{getMessage('common_retry')}
							</Button>
						</div>
					</>
				)}
			</div>
		);
	} else {
		return <Loader className={cnSelectTranslator('Loader')} />;
	}
};
