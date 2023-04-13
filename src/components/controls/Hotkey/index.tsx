import React, { FC, useEffect, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';

import { LayoutFlow } from '../../layouts/LayoutFlow/LayoutFlow';
import { Button } from '../../primitives/Button/Button.bundle/universal';

export type HotkeyProps = {
	value: string | null;
	onChange: (value: string | null) => void;
};

/**
 * Convert key code to unified format
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
 */
export const getUnifiedKeyName = (code: string) => {
	// Skip unidentified codes
	if (code === '' || code === 'Unidentified') return null;

	const prefixesToReplace: Record<string, string> = {
		OS: 'Meta',
		AudioVolume: 'Volume',
	};

	// Return literal with removed prefix
	const literalPrefixes = ['Key', 'Digit'];
	const literalPrefix = literalPrefixes.find((prefix) => code.startsWith(prefix));
	if (literalPrefix !== undefined) {
		return code.slice(literalPrefix.length);
	}

	// Fix prefix
	const prefixToReplace = Object.keys(prefixesToReplace).find((prefix) =>
		code.startsWith(prefix),
	);
	if (prefixToReplace !== undefined) {
		code = prefixesToReplace[prefixToReplace] + code.slice(prefixToReplace.length);
	}

	// Shorten codes with suffix "Left"
	if (!code.startsWith('Arrow') && code.endsWith('Left')) {
		code = code.slice(0, -4);
	}

	return code;
};

// TODO: unpress all keys by unfocus tab or document or change focus
export const onHotkeysPressed = (
	hotkeys: string,
	callback: (event: KeyboardEvent) => void,
) => {
	const hotkeysArray = hotkeys.split('+');

	const pressedKeys: Record<string, boolean> = {};

	const onKeyDown = (evt: KeyboardEvent) => {
		const keyName = getUnifiedKeyName(evt.code);
		if (keyName === null) return;

		pressedKeys[keyName] = true;

		const isHotkeysPressed =
			hotkeysArray.length > 0 && hotkeysArray.every((key) => pressedKeys[key]);
		if (isHotkeysPressed) {
			callback(evt);
		}
	};

	const onKeyUp = (evt: KeyboardEvent) => {
		const keyName = getUnifiedKeyName(evt.code);
		if (keyName === null) return;

		pressedKeys[keyName] = false;
	};

	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);
	return () => {
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('keyup', onKeyUp);
	};
};

export const Hotkey: FC<HotkeyProps> = ({ value, onChange }) => {
	const [isFocus, setIsFocus] = useState(false);

	useEffect(() => {
		if (!isFocus) return;

		let pressedKeys: Record<string, boolean> = {};

		const onKeyDown = (evt: KeyboardEvent) => {
			const keyName = getUnifiedKeyName(evt.code);
			if (keyName === null) return;

			evt.preventDefault();
			pressedKeys[keyName] = true;
		};

		const onKeyUp = (evt: KeyboardEvent) => {
			const keyName = getUnifiedKeyName(evt.code);
			if (keyName === null) return;

			evt.preventDefault();
			pressedKeys[keyName] = false;
			const pressedKeysValues = Object.values(pressedKeys);

			// Reset hotkeys
			if (keyName === 'Escape' && pressedKeysValues.length === 1) {
				pressedKeys = {};
				onChange(null);
				return;
			}

			// Record hotkeys
			if (
				pressedKeysValues.length > 0 &&
				pressedKeysValues.every((isPressed) => !isPressed)
			) {
				const keys = Object.keys(pressedKeys)
					.sort((a, b) => b.length - a.length)
					.join('+');

				pressedKeys = {};
				onChange(keys);
			}
		};

		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('keyup', onKeyUp);
		};
	}, [isFocus, onChange]);

	return (
		<LayoutFlow direction="horizontal" indent="m">
			<Textinput
				onFocus={() => {
					setIsFocus(true);
				}}
				onBlur={() => {
					setIsFocus(false);
				}}
				value={value ?? ''}
				placeholder={isFocus ? 'Press keys' : 'Focus to record hotkeys'}
			/>
			<Button onClick={() => onChange(null)}>Reset</Button>
		</LayoutFlow>
	);
};
