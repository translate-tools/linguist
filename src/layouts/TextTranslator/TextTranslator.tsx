import React, { FC, Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { cn } from '@bem-react/classname';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { useIsFirstRenderRef } from '../../lib/hooks/useIsFirstRenderRef';
import { useTTS } from '../../lib/hooks/useTTS';
import { getLanguageNameByCode, getMessage } from '../../lib/language';
import { MutableValue } from '../../types/utils';

import { suggestLanguage } from '../../requests/backend/suggestLanguage';

import { TabData } from '../../pages/popup/layout/PopupWindow';

import { LanguagePanel } from '../../components/LanguagePanel/LanguagePanel';
import { Textarea } from '../../components/Textarea/Textarea.bundle/desktop';
import { Button } from '../../components/Button/Button.bundle/desktop';
import { Icon } from '../../components/Icon/Icon.bundle/desktop';
import { BookmarksButton } from '../../components/Bookmarks/BookmarksButton';

import './TextTranslator.css';
import { addTranslationHistoryEntry } from '../../requests/backend/history/addTranslationHistoryEntry';
import { TRANSLATION_ORIGIN } from '../../requests/backend/history/constants';
import { ITranslation } from '../../types/translation/Translation';

export const cnTextTranslator = cn('TextTranslator');

export type TranslationState = {
	originalText: string;
	translatedText: string | null;
};

export interface TextTranslatorProps
	extends MutableValue<'userInput', string>,
		MutableValue<'from', string>,
		MutableValue<'to', string>,
		// It must be null only when translate result never be set or after reset input
		MutableValue<'lastTranslation', TranslationState | null> {
	/**
	 * Features of translator module
	 */
	translatorFeatures: TabData['translatorFeatures'];

	/**
	 * Callback which translate text
	 */
	translateHook: (text: string, from: string, to: string) => Promise<string>;

	/**
	 * Ref to input
	 */
	inputControl?: Ref<HTMLTextAreaElement>;

	/**
	 * Delay for handle input
	 */
	inputDelay?: number;

	/**
	 * Init phase say to component - await full loading
	 *
	 * Useful to prevent translate
	 */
	initPhase?: boolean;

	/**
	 * Enable spellcheck
	 */
	spellCheck?: boolean;

	enableLanguageSuggestions?: boolean;
	enableLanguageSuggestionsAlways?: boolean;

	isMobile?: boolean;
}

/**
 * Component for translate any text
 */
export const TextTranslator: FC<TextTranslatorProps> = ({
	from,
	to,
	setFrom,
	setTo,
	lastTranslation,
	setLastTranslation,
	translatorFeatures,
	translateHook,
	spellCheck,
	inputControl: inputControlExternal,
	inputDelay = 600,
	enableLanguageSuggestions = true,
	enableLanguageSuggestionsAlways = true,
	isMobile,
}) => {
	const [userInput, setUserInput] = useState(lastTranslation?.originalText ?? '');
	const [translation, setTranslation] = useState<{
		text: string;
		original: string;
	} | null>(
		lastTranslation !== null && lastTranslation.translatedText !== null
			? {
				original: lastTranslation.originalText,
				text: lastTranslation.translatedText,
			  }
			: null,
	);

	const [inTranslateProcess, setInTranslateProcess] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const isFirstRenderRef = useIsFirstRenderRef();

	const isTranslatedTextRelative =
		translation !== null && translation.original === userInput;

	const [activeTTS, setActiveTTS] = useState<symbol | null>(null);
	const TTSSignal = {
		active: activeTTS,
		setActive: setActiveTTS,
	};
	const ttsOriginal = useTTS(from, userInput, TTSSignal);
	const ttsTranslate = useTTS(to, translation ? translation.text : null, TTSSignal);

	//
	// Lang suggestions
	//

	const [languageSuggestion, setLanguageSuggestion] = useState<null | string>(null);

	const isSuggestLanguage =
		enableLanguageSuggestions && (enableLanguageSuggestionsAlways || from === 'auto');

	// Hide suggestion while change language
	useEffect(() => {
		setLanguageSuggestion(null);
	}, [from]);

	// Null `languageSuggestion` while disable suggestions
	useEffect(() => {
		if (!isSuggestLanguage) {
			setLanguageSuggestion(null);
		}
	}, [isSuggestLanguage]);

	const applySuggestedLanguage: React.MouseEventHandler = useCallback(
		(evt) => {
			evt.preventDefault();

			if (languageSuggestion !== null) {
				setFrom(languageSuggestion);
				setLanguageSuggestion(null);
			}
		},
		[languageSuggestion, setFrom],
	);

	//
	// Translation
	//

	// Translate manager
	const textStateContext = useRef(Symbol('TextContext'));
	const translate = useCallback(() => {
		const localContext = textStateContext.current;

		translateHook(userInput, from, to)
			.then((response) => {
				if (localContext !== textStateContext.current) {
					return;
				}

				if (typeof response !== 'string') {
					throw new Error(
						`[${getMessage('common_error')}: unexpected response]`,
					);
				}

				setTranslation({
					text: response,
					original: userInput,
				});

				addTranslationHistoryEntry({
					origin: TRANSLATION_ORIGIN.USER_INPUT,
					translation: {
						from,
						to,
						originalText: userInput,
						translatedText: response,
					},
				});
			})
			.catch((reason) => {
				if (localContext !== textStateContext.current) return;

				if (reason instanceof Error) {
					setErrorMessage(`${getMessage('common_error')}: ${reason.message}`);
					return;
				}

				setErrorMessage(getMessage('message_unknownError'));
			})
			.finally(() => {
				if (localContext !== textStateContext.current) return;

				setInTranslateProcess(false);
			});
	}, [translateHook, userInput, from, to]);

	const resetTemporaryTextState = useCallback(() => {
		// Stop translation
		textStateContext.current = Symbol('TextContext');
		setInTranslateProcess(false);

		// Clear text states
		setErrorMessage(null);
		setLanguageSuggestion(null);
	}, []);

	// Clear text and stop translation
	const clearState = useCallback(() => {
		resetTemporaryTextState();

		// Clear text
		setUserInput('');
		setTranslation(null);
	}, [resetTemporaryTextState]);

	const isPreventClearTranslation = useRef(false);
	const swapLanguages = useCallback(
		({ from, to }: { from: string; to: string }) => {
			isPreventClearTranslation.current = true;

			ReactDOM.unstable_batchedUpdates(() => {
				clearState();

				// Set translate as input
				if (translation !== null) {
					setUserInput(translation.text);
					setTranslation({
						text: userInput,
						original: translation.text,
					});
				}

				setFrom(from);
				setTo(to);
			});
		},
		[clearState, setFrom, setTo, translation, userInput],
	);

	const showLanguageSuggestion = useCallback(() => {
		if (!isSuggestLanguage) return;

		const localContext = textStateContext.current;
		suggestLanguage(userInput).then((lang) => {
			if (localContext !== textStateContext.current || !isSuggestLanguage) return;
			setLanguageSuggestion(lang);
		});
	}, [isSuggestLanguage, userInput]);

	const rememberTranslationState = useImmutableCallback(() => {
		setLastTranslation(
			userInput.length === 0
				? null
				: {
					originalText: userInput,
					translatedText: isTranslatedTextRelative
						? translation.text
						: null,
				  },
		);
	}, [isTranslatedTextRelative, setLastTranslation, translation, userInput]);

	const handleText = useImmutableCallback(() => {
		// Translate
		if (from !== to && userInput.length > 0) {
			setInTranslateProcess(true);
			setErrorMessage(null);
			translate();
		}

		showLanguageSuggestion();
	}, [from, to, userInput, showLanguageSuggestion, translate]);

	// TODO: think about move logic to effect
	// Translate by changes
	const [setTranslateTask] = useDelayCallback();
	const onTextChange = useCallback(
		(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
			const text = evt.target.value;

			// Clear state
			if (text.length === 0) {
				clearState();
				return;
			}

			resetTemporaryTextState();
			setUserInput(text);
			setTranslateTask(handleText, inputDelay);
		},
		[clearState, handleText, inputDelay, resetTemporaryTextState, setTranslateTask],
	);

	// Translate text from last state if it not have translation
	const isRequiredInitTranslate = useRef(userInput.length > 0 && translation === null);
	useEffect(() => {
		if (!isRequiredInitTranslate.current) return;

		handleText();
	}, [handleText]);

	// Handle languages changes
	useEffect(() => {
		if (isFirstRenderRef.current) return;

		resetTemporaryTextState();

		// Special case for swap langs
		if (isPreventClearTranslation.current) {
			isPreventClearTranslation.current = false;
		} else {
			setTranslation(null);
		}

		handleText();
	}, [from, to, handleText, resetTemporaryTextState, isFirstRenderRef]);

	// Backup state by changes
	useEffect(() => {
		rememberTranslationState();
	}, [rememberTranslationState, userInput, translation]);

	const dictionaryData: ITranslation | null = useMemo(() => {
		if (errorMessage !== null || translation === null || !isTranslatedTextRelative)
			return null;

		return {
			from,
			to,
			originalText: userInput,
			translatedText: translation.text,
		};
	}, [errorMessage, from, isTranslatedTextRelative, to, translation, userInput]);

	const [isFocusOnInput, setIsFocusOnInput] = useState(false);

	// TODO: hide suggestions only for languages which is not supported by translator
	const langSuggestion =
		languageSuggestion && languageSuggestion !== from
			? getLanguageNameByCode(languageSuggestion, false)
			: null;

	const resultText = inTranslateProcess
		? '...'
		: errorMessage !== null
			? `[${errorMessage}]`
			: translation !== null
				? translation.text
				: null;

	return (
		<div className={cnTextTranslator({ view: isMobile ? 'mobile' : undefined })}>
			<div className={cnTextTranslator('LangPanel')}>
				<LanguagePanel
					auto={translatorFeatures.isSupportAutodetect}
					languages={translatorFeatures.supportedLanguages}
					from={from}
					to={to}
					setFrom={(from) => from !== undefined && setFrom(from)}
					setTo={(to) => to !== undefined && setTo(to)}
					swapHandler={swapLanguages}
					preventFocusOnPress={isFocusOnInput}
					mobile={isMobile}
				/>
			</div>
			<div className={cnTextTranslator('InputContainer')}>
				<div className={cnTextTranslator('InputContainerWrapper')}>
					{langSuggestion && (
						<div className={cnTextTranslator('LanguageSuggestion')}>
							<Icon glyph="autoFix" scalable={false} size="s" />
							<span>
								{getMessage(
									'textTranslator_suggestLanguage',
								).toLowerCase()}
							</span>
							<a href="#" onClick={applySuggestedLanguage}>
								{langSuggestion.toLowerCase()}
							</a>
						</div>
					)}

					<div>
						<Textarea
							placeholder={getMessage(
								'textTranslator_translateInputPlaceholder',
							)}
							className={cnTextTranslator('Input')}
							controlProps={{ innerRef: inputControlExternal }}
							value={userInput}
							onChange={onTextChange}
							hasClear
							onClearClick={clearState}
							spellCheck={spellCheck}
							onFocus={() => setIsFocusOnInput(true)}
							onBlur={() => setIsFocusOnInput(false)}
							addonAfterControl={
								<div className={cnTextTranslator('TextActions')}>
									<Button
										disabled={userInput.length === 0}
										onPress={ttsOriginal.toggle}
										view="clear"
										size="s"
									>
										<Icon glyph="volume-up" scalable={false} />
									</Button>
									<BookmarksButton translation={dictionaryData} />
								</div>
							}
						/>
					</div>
					<div className={cnTextTranslator('ResultContainer')}>
						<div className={cnTextTranslator('ResultText')}>
							{resultText !== null
								? resultText
								: getMessage('textTranslator_translatePlaceholder')}
						</div>
						<div className={cnTextTranslator('TextActions')}>
							<Button
								disabled={inTranslateProcess || translation === null}
								onPress={ttsTranslate.toggle}
								view="clear"
								size="s"
							>
								<Icon glyph="volume-up" scalable={false} />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
