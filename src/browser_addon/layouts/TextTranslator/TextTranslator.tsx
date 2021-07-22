import React, { FC, Ref, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@bem-react/classname';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';
import { usePrevious } from 'react-elegant-ui/esm/hooks/usePrevious';

import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';

import { useTranslateFavorite } from '../../lib/hooks/useTranslateFavorite';
import { getMessage } from '../../lib/language';
import { MutableValue } from '../../types/utils';

import { TabData } from '../../pages/popup/layout/PopupWindow';
import { LanguagePanel } from '../../components/LanguagePanel/LanguagePanel';
import { Textarea } from '../../components/Textarea/Textarea.bundle/desktop';

import './TextTranslator.css';

export const cnTextTranslator = cn('TextTranslator');

export interface TextTranslatorProps
	extends MutableValue<'userInput', string>,
		MutableValue<'from', string>,
		MutableValue<'to', string>,
		MutableValue<
			'translationData',
			{
				text: string;
				translate: string;
			}
		> {
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
}

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
	inputControl: inputControlExternal,
	inputDelay = 600,
	noTranslate = false,
}) => {
	const [inTranslateProcess, setInTranslateProcess] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

	const immediatelyTranslate = useRef(false);
	const swapLanguages = ({ from, to }: { from: string; to: string }) => {
		translateContext.current = Symbol('TranslateContext');
		immediatelyTranslate.current = true;

		setFrom(from);
		setTo(to);

		const translatedText = translationData.translate;
		setUserInput(translatedText);
		setTranslationData({ text: translatedText, translate: '' });
	};

	const clearState = useCallback(() => {
		setErrorMessage(null);
		setUserInput('');
		setTranslationData({ text: '', translate: '' });
	}, [setTranslationData, setUserInput]);

	// Translate by changes
	const [setTranslateTask, resetTranslateTask] = useDelayCallback();

	const prevNoTranslate = usePrevious(noTranslate);
	useEffect(() => {
		// Ignore changes
		if (noTranslate || prevNoTranslate) {
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
		if (immediatelyTranslate.current) {
			immediatelyTranslate.current = false;
			resetTranslateTask();
			translateTask();
		} else {
			setTranslateTask(translateTask, inputDelay);
		}
		// Ignore `prevNoTranslate`
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		from,
		to,
		userInput,
		clearState,
		setTranslateTask,
		translate,
		inputDelay,
		resetTranslateTask,
		noTranslate,
	]);

	// Favorite state
	const {
		isFavorite,
		toggleFavorite,
		// update: updateFavoriteData,
	} = useTranslateFavorite({
		from,
		to,
		text: userInput,
		translate: errorMessage !== null ? null : translationData.translate,
	});

	const setIsFavoriteProxy = useCallback(
		(state: boolean) => {
			if (state === isFavorite) return;
			toggleFavorite();
		},
		[isFavorite, toggleFavorite],
	);

	const resultText = inTranslateProcess
		? '...'
		: errorMessage !== null
			? `[${errorMessage}]`
			: translationData.translate;

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
				/>
			</div>
			<div>
				<Checkbox
					label={getMessage('common_action_addToDictionary')}
					checked={isFavorite}
					setChecked={setIsFavoriteProxy}
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
						onChange={(evt) => setUserInput(evt.target.value)}
						hasClear
						onClearClick={clearState}
						// TODO: make it as option
						spellCheck={true}
					/>
					<div className={cnTextTranslator('Result')}>
						{resultText.length > 0
							? resultText
							: getMessage('textTranslator_translatePlaceholder')}
					</div>
				</div>
			</div>
		</div>
	);
};
