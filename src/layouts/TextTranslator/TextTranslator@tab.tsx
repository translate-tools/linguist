import React, { useContext, useEffect, useRef, useState } from 'react';
import { type as makeType, string as stringType } from 'io-ts';
import { useFocusVisible } from '@react-aria/interactions';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';

import { LangCode, LangCodeWithAuto } from '../../types/runtime';
import { tryDecodeObject } from '../../lib/types';

import { translate as sendTranslateRequest } from '../../requests/backend/translate';

import { PopupWindowContext, TabComponent } from '../../pages/popup/layout/PopupWindow';
import { TextTranslator, TextTranslatorProps } from './TextTranslator';

export const lastStateType = makeType({
	from: LangCodeWithAuto,
	to: LangCode,
	text: stringType,
	translatedText: stringType,
});

/**
 * Clear data of last translation
 */
export const clearLastTranslation = () => {
	const lastStateRaw = localStorage.getItem('TextTranslator.lastState');

	if (lastStateRaw !== null) {
		try {
			const lastStateParsed = JSON.parse(lastStateRaw);
			const lastState = tryDecodeObject(lastStateType, lastStateParsed);
			lastState.text = '';
			lastState.translatedText = '';

			const serializedData = JSON.stringify(lastState);
			localStorage.setItem('TextTranslator.lastState', serializedData);
		} catch (error) {
			console.error(error);
		}
	}
};

/**
 * Wrapper on `TextTranslator` to use as tab in `PopupWindow`
 */
export const TextTranslatorTab: TabComponent = ({
	config,
	translatorFeatures,
	id: tabId,
}) => {
	// Init state
	const initData = useRef<Record<string, string>>();
	if (!initData.current) {
		initData.current = {
			from: translatorFeatures.isSupportAutodetect
				? 'auto'
				: translatorFeatures.supportedLanguages[0],
			to: config.language,
		};
	}

	const [from, setFrom] = useState(initData.current.from);
	const [to, setTo] = useState(initData.current.to);

	const [userInput, setUserInput] = useState('');
	const [translationData, setTranslationData] = useState<
		TextTranslatorProps['translationData']
	>({ translate: '', text: '' });

	// Try recovery last translate state
	const [inited, setInited] = useState(false);
	useEffect(() => {
		const lastStateRaw = localStorage.getItem('TextTranslator.lastState');
		if (lastStateRaw !== null) {
			try {
				const lastStateParsed = JSON.parse(lastStateRaw);
				const lastState = tryDecodeObject(lastStateType, lastStateParsed);

				const { isSupportAutodetect, supportedLanguages } = translatorFeatures;
				const {
					from: lastFrom,
					to: lastTo,
					text: lastText,
					translatedText: lastTranslatedText,
				} = lastState;

				if (
					(lastFrom === 'auto' && isSupportAutodetect) ||
					supportedLanguages.indexOf(lastFrom) !== -1
				) {
					setFrom(lastFrom);
				} else {
					throw new Error(`Invalid property "from" in lastState`);
				}

				if (supportedLanguages.indexOf(lastTo) !== -1) {
					setTo(lastTo);
				} else {
					throw new Error(`Invalid property "to" in lastState`);
				}

				// Recovery text
				if (
					config.textTranslator.rememberText &&
					lastText.length > 0 &&
					lastTranslatedText.length > 0
				) {
					setUserInput(lastText);
					setTranslationData({ text: lastText, translate: lastTranslatedText });
				}
			} catch (err) {
				console.error(err);
			}
		}

		setInited(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Remember user input
	const serializeLenLimit = 100000;
	const serializeDelay = 300;
	const [setDelayCb] = useDelayCallback();

	useEffect(() => {
		const serialize = () => {
			const { text, translate } = translationData;

			try {
				const rememberText =
					config.textTranslator.rememberText &&
					text.length <= serializeLenLimit &&
					translate.length <= serializeLenLimit &&
					userInput.length > 0;

				const stringData = JSON.stringify({
					from,
					to,
					text: rememberText ? text : '',
					translatedText: rememberText ? translate : '',
				});
				localStorage.setItem('TextTranslator.lastState', stringData);
			} catch (err) {
				console.error(err);
			}
		};

		setDelayCb(serialize, serializeDelay);
	}, [
		setDelayCb,
		translationData,
		config.textTranslator.rememberText,
		userInput.length,
		from,
		to,
	]);

	// Focus on input when focus is free
	const { activeTab } = useContext(PopupWindowContext);
	const { isFocusVisible } = useFocusVisible();
	const inputControl = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		if (
			activeTab === tabId &&
			inputControl.current !== null &&
			(!isFocusVisible || document.activeElement === document.body)
		) {
			inputControl.current.focus();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab, tabId]);

	return (
		<TextTranslator
			translatorFeatures={translatorFeatures}
			translateHook={sendTranslateRequest}
			noTranslate={inited === false}
			spellCheck={config.textTranslator.spellCheck}
			{...{
				from,
				setFrom,
				to,
				setTo,
				translationData,
				setTranslationData,
				userInput,
				setUserInput,
				inputControl,
			}}
		/>
	);
};
