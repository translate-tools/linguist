import React, { useContext, useEffect, useRef, useState } from 'react';
import {
	type as makeType,
	union as unionType,
	null as nullType,
	string as stringType,
} from 'io-ts';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';
import { useFocusVisible } from '@react-aria/interactions';

import { LangCode, LangCodeWithAuto } from '../../types/runtime';
import { tryDecodeObject } from '../../lib/types';

import { translate as sendTranslateRequest } from '../../requests/backend/translate';

import {
	InitFn,
	TabComponent,
	PopupWindowContext,
} from '../../pages/popup/layout/PopupWindow';
import { TextTranslator, TextTranslatorProps } from './TextTranslator';

export const lastStateType = makeType({
	from: LangCodeWithAuto,
	to: LangCode,
	translate: unionType([
		makeType({
			text: stringType,
			translate: stringType,
		}),
		nullType,
	]),
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
			lastState.translate = null;

			const serializedData = JSON.stringify(lastState);
			localStorage.setItem('TextTranslator.lastState', serializedData);
		} catch (error) {
			console.error(error);

			//  Clear storage
			localStorage.removeItem('TextTranslator.lastState');
		}
	}
};

type InitData = {
	from: string;
	to: string;
};

/**
 * Wrapper on `TextTranslator` to use as tab in `PopupWindow`
 */
export const TextTranslatorTab: TabComponent<InitFn<InitData>> = ({
	config,
	translatorFeatures,
	id: tabId,
	initData,
}) => {
	const { from: initFrom, to: initTo } = initData;
	const [from, setFrom] = useState(initFrom);
	const [to, setTo] = useState(initTo);

	const [userInput, setUserInput] = useState('');
	const [translationData, setTranslationData] =
		useState<TextTranslatorProps['translationData']>(null);

	// Try recovery last translate state
	const [isInit, setIsInit] = useState(false);
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
					translate: lastTranslate,
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
				if (config.textTranslator.rememberText && lastTranslate !== null) {
					setUserInput(lastTranslate.text);
					setTranslationData(lastTranslate);
				}
			} catch (err) {
				console.error(err);

				//  Clear storage
				localStorage.removeItem('TextTranslator.lastState');
			}
		}

		setIsInit(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Remember user input
	const serializeLenLimit = 100000;
	const serializeDelay = 300;
	const [setDelayCb] = useDelayCallback();

	useEffect(() => {
		const serialize = () => {
			try {
				const rememberText =
					config.textTranslator.rememberText &&
					userInput.length > 0 &&
					translationData !== null &&
					translationData.text.length <= serializeLenLimit &&
					translationData.translate.length <= serializeLenLimit;

				const stringData = JSON.stringify({
					from,
					to,
					translate: rememberText ? translationData : null,
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

	// It need to prevent translating while init state,
	// `noTranslate` need to prevent update right after change `noTranslate`
	const [noTranslate, setNoTranslate] = useState(true);
	useEffect(() => {
		if (isInit) {
			setNoTranslate(false);
		}
	}, [isInit]);

	return (
		<TextTranslator
			translatorFeatures={translatorFeatures}
			translateHook={sendTranslateRequest}
			noTranslate={noTranslate}
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

TextTranslatorTab.init = async ({ translatorFeatures, config }) => {
	return {
		from: translatorFeatures.isSupportAutodetect
			? 'auto'
			: translatorFeatures.supportedLanguages[0],
		to: config.language,
	};
};
