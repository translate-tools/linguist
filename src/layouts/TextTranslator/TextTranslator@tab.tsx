import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';
import { useFocusVisible } from '@react-aria/interactions';

import { translate as sendTranslateRequest } from '../../requests/backend/translate';

import {
	InitFn,
	TabComponent,
	PopupWindowContext,
} from '../../pages/popup/layout/PopupWindow';
import { TextTranslator, TextTranslatorProps, TranslationState } from './TextTranslator';
import { TextTranslatorStorage } from './TextTranslator.utils/TextTranslatorStorage';

type InitData = {
	from: string;
	to: string;
	lastTranslate: TranslationState | null;
};

/**
 * Wrapper on `TextTranslator` to use as tab in `PopupWindow`
 */
export const TextTranslatorTab: TabComponent<InitFn<InitData>> = ({
	config,
	translatorFeatures,
	id: tabId,
	initData,
	isMobile,
}) => {
	const [from, setFrom] = useState(initData.from);
	const [to, setTo] = useState(initData.to);

	const [userInput, setUserInput] = useState(
		initData.lastTranslate?.originalText ?? '',
	);
	const [lastTranslation, setLastTranslation] = useState<
		TextTranslatorProps['lastTranslation']
	>(initData.lastTranslate ?? null);

	// Remember user input
	const serializeLenLimit = 100000;
	const serializeDelay = 300;
	const [setDelayCb] = useDelayCallback();

	useEffect(() => {
		const serialize = () => {
			try {
				const translationState: Parameters<
					typeof TextTranslatorStorage['setData']
				>['0'] = {
					// Cast string to `langCode`
					from: from as any,
					to: to as any,
					translate: null,
				};

				if (lastTranslation !== null && config.textTranslator.rememberText) {
					const { originalText, translatedText } = lastTranslation;

					if (
						originalText.length <= serializeLenLimit &&
						(translatedText === null ||
							translatedText.length <= serializeLenLimit)
					) {
						translationState.translate = lastTranslation;
					}
				}

				TextTranslatorStorage.setData(translationState);
			} catch (err) {
				console.error(err);
			}
		};

		setDelayCb(serialize, serializeDelay);
	}, [setDelayCb, lastTranslation, config.textTranslator.rememberText, from, to]);

	// Focus on input when focus is free
	const { activeTab } = useContext(PopupWindowContext);
	const { isFocusVisible } = useFocusVisible();
	const inputControl = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		// TODO: prevent focus for mobile device
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
	// `isInitPhase` need to prevent update right after change `isInitPhase`
	// const [isInitPhase, setIsInitPhase] = useState(true);
	// useEffect(() => {
	// 	setIsInitPhase(false);
	// }, []);

	return (
		<TextTranslator
			translatorFeatures={translatorFeatures}
			translateHook={sendTranslateRequest}
			spellCheck={config.textTranslator.spellCheck}
			enableLanguageSuggestions={config.textTranslator.suggestLanguage}
			enableLanguageSuggestionsAlways={config.textTranslator.suggestLanguageAlways}
			{...{
				from,
				setFrom,
				to,
				setTo,
				lastTranslation,
				setLastTranslation,
				userInput,
				setUserInput,
				inputControl,
				isMobile,
			}}
		/>
	);
};

TextTranslatorTab.init = async ({ translatorFeatures, config }) => {
	let from = translatorFeatures.isSupportAutodetect
		? 'auto'
		: translatorFeatures.supportedLanguages[0];
	let to = config.language;

	// Try recovery state
	let lastTranslate: InitData['lastTranslate'] = null;

	const lastState = await TextTranslatorStorage.getData();
	if (lastState !== null) {
		const { isSupportAutodetect, supportedLanguages } = translatorFeatures;
		const { from: lastFrom, to: lastTo, translate } = lastState;

		if (
			(lastFrom === 'auto' && isSupportAutodetect) ||
			supportedLanguages.indexOf(lastFrom) !== -1
		) {
			from = lastFrom;
		}

		if (supportedLanguages.indexOf(lastTo) !== -1) {
			to = lastTo;
		}

		// Recovery text
		if (config.textTranslator.rememberText && translate !== null) {
			lastTranslate = translate;
		}
	}

	return { from, to, lastTranslate };
};
