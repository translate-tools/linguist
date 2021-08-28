import React, { FC, Ref, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@bem-react/classname';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';

import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';

import { useTranslateFavorite } from '../../lib/hooks/useTranslateFavorite';
import { getMessage } from '../../lib/language';
import { QueuePlayer } from '../../lib/QueuePlayer';
import { MutableValue } from '../../types/utils';

import { getTTS } from '../../requests/backend/getTTS';

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

	// TODO: move it to hook `const [playText1, stopText1] = useTTS({lang, text})`
	const ttsPlayer = useRef<{ target: TTSTarget; player: QueuePlayer } | null>(null);

	const flushTTSPlayer = useCallback((onlyForTarget?: TTSTarget) => {
		if (ttsPlayer.current === null) return;

		const { player, target } = ttsPlayer.current;

		// Skip if target not match
		if (onlyForTarget !== undefined && target !== onlyForTarget) return;

		// Clear
		player.pause();
		ttsPlayer.current = null;
	}, []);

	const runTTS = useCallback(
		async (target: TTSTarget) => {
			// Flush player for previous target
			if (ttsPlayer.current !== null && ttsPlayer.current.target !== target) {
				flushTTSPlayer();
			}

			// Make player
			if (ttsPlayer.current === null) {
				let urls: string[] = [];

				if (target === 'original') {
					urls = await getTTS({
						lang: from,
						text: userInput,
					});
				} else {
					// Skip request with invalid data
					if (translatedText === null) return;

					urls = await getTTS({
						lang: to,
						text: translatedText,
					});
				}

				const player = new QueuePlayer(urls);

				// Skip if player is already set by other event
				if (ttsPlayer.current !== null) return;

				ttsPlayer.current = { target, player };
			}

			// Play/stop
			const { player } = ttsPlayer.current;
			if (player.isPlayed()) {
				player.stop();
			} else {
				player.play();
			}
		},
		[flushTTSPlayer, from, to, translatedText, userInput],
	);

	// Stop and clear player while changes data which it use
	useEffect(() => {
		flushTTSPlayer('original');
	}, [flushTTSPlayer, from, userInput]);

	useEffect(() => {
		flushTTSPlayer('translation');
	}, [flushTTSPlayer, to, translatedText]);

	// Context of translate operation to prevent rewrite result by old slow request
	const translateContext = useRef(Symbol('TranslateContext'));

	// Translate manager
	const translate = useCallback(() => {
		const localContext = translateContext.current;

		translateHook(userInput, from, to)
			.then((response) => {
				if (localContext !== translateContext.current) return;

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
				if (localContext !== translateContext.current) return;

				if (reason instanceof Error) {
					setErrorMessage(`${getMessage('common_error')}: ${reason.message}`);
					return;
				}

				setErrorMessage(getMessage('message_unknownError'));
			})
			.finally(() => {
				if (localContext !== translateContext.current) return;

				setInTranslateProcess(false);
			});
	}, [translateHook, userInput, from, to, setTranslationData]);

	// It need to disable translate delay for next state update
	const disableDelayForNextTranslate = useRef(false);

	const swapLanguages = ({ from, to }: { from: string; to: string }) => {
		translateContext.current = Symbol('TranslateContext');

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
		// Stop translation
		translateContext.current = Symbol('TranslateContext');
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

	useEffect(() => {
		// Ignore changes
		if (noTranslate) {
			return;
		}

		translateContext.current = Symbol('TranslateContext');

		// Clear state
		if (userInput.length === 0) {
			clearState();
			return;
		}

		// Ignore pointless direction
		if (from === to) {
			return;
		}

		const translateTask = () => {
			setInTranslateProcess(true);
			setErrorMessage(null);
			translate();
		};

		// Translate
		if (disableDelayForNextTranslate.current) {
			disableDelayForNextTranslate.current = false;
			resetTranslateTask();
			translateTask();
		} else {
			setTranslateTask(translateTask, inputDelay);
		}
		// Ignore `noTranslate`
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		from,
		to,
		userInput,
		inputDelay,
		clearState,
		resetTranslateTask,
		setTranslateTask,
		translate,
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
