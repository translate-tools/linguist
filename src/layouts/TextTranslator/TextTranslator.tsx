import React, { FC, Ref, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@bem-react/classname';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';

import { useTranslateFavorite } from '../../lib/hooks/useTranslateFavorite';
import { useTTS } from '../../lib/hooks/useTTS';
import { detectLanguage, getLanguageNameByCode, getMessage } from '../../lib/language';
import { MutableValue } from '../../types/utils';

import { TabData } from '../../pages/popup/layout/PopupWindow';
import { LanguagePanel } from '../../components/LanguagePanel/LanguagePanel';
import { Textarea } from '../../components/Textarea/Textarea.bundle/desktop';
import { Button } from '../../components/Button/Button.bundle/desktop';
import { Icon } from '../../components/Icon/Icon.bundle/desktop';

import './TextTranslator.css';

export const cnTextTranslator = cn('TextTranslator');

// Success translated data
export type TranslationResult = {
	text: string;
	translate: string;
};

export interface TextTranslatorProps
	extends MutableValue<'userInput', string>,
		MutableValue<'from', string>,
		MutableValue<'to', string>,
		// It must be null only when translate result never be set or after reset input
		MutableValue<'translationData', TranslationResult | null> {
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
	 * Prevent translate
	 *
	 * It useful while initiate state
	 */
	noTranslate?: boolean;

	/**
	 * Enable spellcheck
	 */
	spellCheck?: boolean;
}

type TTSTarget = 'original' | 'translation';

/**
 * Component for translate any text
 */
export const TextTranslator: FC<TextTranslatorProps> = ({
	from,
	to,
	translationData,
	setTranslationData,
	translatorFeatures,
	setFrom,
	setTo,
	userInput,
	setUserInput,
	translateHook,
	spellCheck,
	inputControl: inputControlExternal,
	inputDelay = 600,
	noTranslate = false,
}) => {
	const [inTranslateProcess, setInTranslateProcess] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [translatedText, setTranslatedText] = useState<string | null>(
		translationData === null ? null : translationData.translate,
	);

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

	// Hide suggestion if language already selected
	useEffect(() => {
		if (from !== 'auto') {
			setLanguageSuggestion(null);
		}
	}, [from]);

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

	// Context of current text state. Its change with change text
	const textStateContext = useRef(Symbol('TextContext'));

	// Update context by change text
	useEffect(() => {
		textStateContext.current = Symbol('TextContext');
	}, [from, to, userInput]);

	// Translate manager
	const translate = useCallback(() => {
		const localContext = textStateContext.current;

		translateHook(userInput, from, to)
			.then((response) => {
				if (localContext !== textStateContext.current) return;

				// throw new Error('Test message');

				if (typeof response !== 'string') {
					const errMsg = `[${getMessage('common_error')}: unexpected response]`;
					throw new Error(errMsg);
				}

				setTranslationData({
					text: userInput,
					translate: response,
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
	}, [translateHook, userInput, from, to, setTranslationData]);

	// It need to disable translate delay for next state update
	const disableDelayForNextTranslate = useRef(false);

	const swapLanguages = ({ from, to }: { from: string; to: string }) => {
		textStateContext.current = Symbol('TextContext');

		// We can't translate right now, because must await an change state,
		// so just mark delay disable for next translate
		disableDelayForNextTranslate.current = true;

		setFrom(from);
		setTo(to);

		// Swap text
		if (translationData !== null) {
			setUserInput(translatedText ?? '');
			setTranslatedText(userInput);
		}
	};

	// Clear text and stop translation
	const clearState = useCallback(() => {
		// Stop async operations
		textStateContext.current = Symbol('TextContext');
		setInTranslateProcess(false);

		// Clear text
		setUserInput('');
		// It will clear in next `useEffect`, but did it here also for UX performance
		setTranslatedText(null);
		setErrorMessage(null);

		// Clear translation data
		setTranslationData(null);
	}, [setTranslationData, setUserInput]);

	// Translate by changes
	const [setTranslateTask, resetTranslateTask] = useDelayCallback();

	const handleNewText = useImmutableCallback(() => {
		const translateText = () => {
			// Ignore changes
			if (noTranslate) {
				return;
			}

			// Ignore pointless direction
			if (from === to) {
				return;
			}

			setInTranslateProcess(true);
			setErrorMessage(null);
			translate();
		};

		translateText();

		const suggestLanguage = () => {
			if (from !== 'auto') {
				setLanguageSuggestion(null);
				return;
			}

			const localContext = textStateContext.current;

			// TODO: replace it to request (in future it may be replaced to some translator API)
			detectLanguage(userInput).then((lang) => {
				if (localContext !== textStateContext.current) return;
				setLanguageSuggestion(lang);
			});
		};

		suggestLanguage();
	}, [from, noTranslate, to, translate, userInput]);

	// Handle text by change with debounce
	useEffect(() => {
		// Clear state
		if (userInput.length === 0) {
			clearState();
			return;
		}

		if (disableDelayForNextTranslate.current) {
			disableDelayForNextTranslate.current = false;
			resetTranslateTask();
			handleNewText();
		} else {
			setTranslateTask(handleNewText, inputDelay);
		}
	}, [
		from,
		to,
		userInput,
		inputDelay,
		clearState,
		resetTranslateTask,
		setTranslateTask,
		translate,
		handleNewText,
	]);

	// Sync local result with actual data
	useEffect(() => {
		const translatedText =
			translationData === null ? null : translationData.translate;
		setTranslatedText(translatedText);
	}, [translationData]);

	// Favorite state
	const {
		isFavorite,
		toggleFavorite,
		// update: updateFavoriteData,
	} = useTranslateFavorite({
		from,
		to,
		text: userInput,
		translate:
			translationData !== null && errorMessage === null
				? translationData.translate
				: null,
	});

	const setIsFavoriteProxy = useCallback(
		(state: boolean) => {
			if (state === isFavorite) return;
			toggleFavorite();
		},
		[isFavorite, toggleFavorite],
	);

	const [isFocusOnInput, setIsFocusOnInput] = useState(false);

	const resultText = inTranslateProcess
		? '...'
		: errorMessage !== null
			? `[${errorMessage}]`
			: translatedText;

	const isShowFullData = !inTranslateProcess && errorMessage === null;
	return (
		<div className={cnTextTranslator()}>
			<div className={cnTextTranslator('LangPanel')}>
				<LanguagePanel
					auto={translatorFeatures.isSupportAutodetect}
					languages={translatorFeatures.supportedLanguages}
					from={from}
					to={to}
					setFrom={(from) => from !== undefined && setFrom(from)}
					setTo={(to) => to !== undefined && setTo(to)}
					swapHandler={swapLanguages}
					disableSwap={!isShowFullData}
					preventFocusOnPress={isFocusOnInput}
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
					{languageSuggestion && (
						// TODO: use class for block
						// TODO: use i18n
						<div>
							<Icon glyph="autoFix" scalable={false} size="s" /> it seems
							that language is{' '}
							<a href="#" onClick={applySuggestedLanguage}>
								{getLanguageNameByCode(languageSuggestion).toLowerCase()}
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
							onChange={(evt) => {
								setUserInput(evt.target.value);
							}}
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
