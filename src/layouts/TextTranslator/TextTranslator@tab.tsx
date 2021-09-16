import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDelayCallback } from 'react-elegant-ui/esm/hooks/useDelayCallback';
import { useFocusVisible } from '@react-aria/interactions';

import { translate as sendTranslateRequest } from '../../requests/backend/translate';

import {
	InitFn,
	TabComponent,
	PopupWindowContext,
} from '../../pages/popup/layout/PopupWindow';
import { TextTranslator, TextTranslatorProps } from './TextTranslator';
import { TextTranslatorStorage } from './TextTranslator.utils/TextTranslatorStorage';

type InitData = {
	from: string;
	to: string;
	lastTranslate: {
		text: string;
		translate: string;
	} | null;
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

	const [userInput, setUserInput] = useState(initData.lastTranslate?.text ?? '');
	const [translationData, setTranslationData] = useState<
		TextTranslatorProps['translationData']
	>(initData.lastTranslate ?? null);

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

				TextTranslatorStorage.setData({
					// Cast string to `langCode`
					from: from as any,
					to: to as any,
					translate: rememberText ? translationData : null,
				});
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
	// `isInitPhase` need to prevent update right after change `isInitPhase`
	const [isInitPhase, setIsInitPhase] = useState(true);
	useEffect(() => {
		setIsInitPhase(false);
	}, []);

	return (
		<TextTranslator
			translatorFeatures={translatorFeatures}
			translateHook={sendTranslateRequest}
			initPhase={isInitPhase}
			spellCheck={config.textTranslator.spellCheck}
			enableLanguageSuggestions={config.textTranslator.suggestLanguage}
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
