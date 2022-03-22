import React, { FC, Ref, useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { cn } from '@bem-react/classname';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';

import { useTranslateFavorite } from '../../lib/hooks/useTranslateFavorite';
import { useTTS } from '../../lib/hooks/useTTS';
import { getLanguageNameByCode, getMessage } from '../../lib/language';
import { MutableValue } from '../../types/utils';

import { suggestLanguage } from '../../requests/backend/suggestLanguage';

import { TabData } from '../../pages/popup/layout/PopupWindow';
import { LanguagePanel } from '../../components/LanguagePanel/LanguagePanel';
import { Textarea } from '../../components/Textarea/Textarea.bundle/desktop';
import { Button } from '../../components/Button/Button.bundle/desktop';
import { Icon } from '../../components/Icon/Icon.bundle/desktop';

import './TextTranslator.css';

export const cnTextTranslator = cn('TextTranslator');

export type TranslationState = {
	text: string;
	translate: string | null;
};

export interface TextTranslatorProps
	extends MutableValue<'userInput', string>,
		MutableValue<'from', string>,
		MutableValue<'to', string>,
		// It must be null only when translate result never be set or after reset input
		MutableValue<'translationData', TranslationState | null> {
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

type TTSTarget = 'original' | 'translation';

/**
 * Component for translate any text
 */
export const TextTranslator: FC<TextTranslatorProps> = ({
	from,
	to,
	setFrom,
	setTo,
	// TODO: use it to init state
	// translationData,
	setTranslationData,
	translatorFeatures,
	translateHook,
	spellCheck,
	inputControl: inputControlExternal,
	inputDelay = 600,
	enableLanguageSuggestions = true,
	enableLanguageSuggestionsAlways = true,
	isMobile,
}) => {
	const [userInput, setUserInput] = useState('');
	const [translatedText, setTranslatedText] = useState<string | null>(null);

	const [inTranslateProcess, setInTranslateProcess] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	//
	// TTS
	//

	const originalTTS = useTTS(from, userInput);
	const translateTTS = useTTS(to, translatedText || '');

	const ttsTarget = useRef<TTSTarget | null>(null);

	const getTTSPlayer = useCallback(
		(target: TTSTarget): ReturnType<typeof useTTS> => {
			switch (target) {
			case 'original':
				return originalTTS;
			case 'translation':
				return translateTTS;
			default:
				throw new Error('invalid target');
			}
		},
		[originalTTS, translateTTS],
	);

	const runTTS = useCallback(
		async (target: TTSTarget) => {
			// Stop player for current target if it different from local target
			if (ttsTarget.current !== null && ttsTarget.current !== target) {
				getTTSPlayer(ttsTarget.current).stop();
			}

			// Update current target
			ttsTarget.current = target;

			// Play/stop
			const player = getTTSPlayer(target);
			if (player.isPlayed()) {
				player.stop();
			} else {
				player.play();
			}
		},
		[getTTSPlayer],
	);

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

				setTranslatedText(response);
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
		setTranslatedText(null);
	}, [resetTemporaryTextState]);

	const isPreventClearTranslation = useRef(false);
	const swapLanguages = useCallback(
		({ from, to }: { from: string; to: string }) => {
			isPreventClearTranslation.current = true;

			ReactDOM.unstable_batchedUpdates(() => {
				clearState();

				// Set translate as input
				if (translatedText !== null) {
					setUserInput(translatedText);
					setTranslatedText(userInput);
				}

				setFrom(from);
				setTo(to);
			});
		},
		[clearState, setFrom, setTo, translatedText, userInput],
	);

	const showLanguageSuggestion = useCallback(() => {
		if (!isSuggestLanguage) return;

		const localContext = textStateContext.current;
		suggestLanguage(userInput).then((lang) => {
			if (localContext !== textStateContext.current || !isSuggestLanguage) return;
			setLanguageSuggestion(lang);
		});
	}, [isSuggestLanguage, userInput]);

	const saveState = useImmutableCallback(() => {
		setTranslationData(
			userInput.length === 0
				? null
				: {
					text: userInput,
					translate: translatedText,
				  },
		);
	}, [setTranslationData, translatedText, userInput]);

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

	// TODO: auto translate when translated text is null

	// Handle languages changes
	useEffect(() => {
		// TODO: skip for initialization

		resetTemporaryTextState();

		// Special case for swap langs
		if (isPreventClearTranslation.current) {
			isPreventClearTranslation.current = false;
		} else {
			setTranslatedText(null);
		}

		handleText();
	}, [from, to, handleText, resetTemporaryTextState]);

	// Backup state by changes
	useEffect(() => {
		saveState();
	}, [saveState, userInput, translatedText]);

	// Backup state by changes
	useEffect(() => {
		saveState();
	}, [saveState, userInput, translatedText]);

	//
	// Favorites
	//

	// Favorite state
	const {
		isFavorite,
		toggleFavorite,
		// update: updateFavoriteData,
	} = useTranslateFavorite({
		from,
		to,
		text: userInput,

		// TODO: make it work back
		translate: null,
		// translate:
		// 	translationData !== null && errorMessage === null
		// 		? translationData.translate
		// 		: null,
	});

	const setIsFavoriteProxy = useCallback(
		(state: boolean) => {
			if (state === isFavorite) return;
			toggleFavorite();
		},
		[isFavorite, toggleFavorite],
	);

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
			: translatedText;

	const isShowFullData = !inTranslateProcess && errorMessage === null;
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
			<div>
				<Checkbox
					label={getMessage('common_action_addToDictionary')}
					checked={isFavorite}
					setChecked={setIsFavoriteProxy}
					disabled={!isShowFullData || userInput.length === 0}
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
										onPress={() => runTTS('original')}
										view="clear"
										size="s"
									>
										<Icon glyph="volume-up" scalable={false} />
									</Button>
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
								disabled={inTranslateProcess || translatedText === null}
								onPress={() => runTTS('translation')}
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
