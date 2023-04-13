import React, { FC, useEffect, useState } from 'react';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';

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

	// Return key code
	if (code.startsWith('Key')) {
		return code.slice(3);
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

			// console.log('up', pressedKeys, pressedKeysValues);
			if (
				pressedKeysValues.length > 0 &&
				pressedKeysValues.every((isPressed) => !isPressed)
			) {
				const keys = Object.keys(pressedKeys).join('+');

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
		<Textinput
			onFocus={() => {
				setIsFocus(true);
			}}
			onBlur={() => {
				setIsFocus(false);
			}}
			value={value ?? ''}
			placeholder="Press keys"
		/>
	);
};
