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

export const onHotkeysPressed = (
	hotkeys: string,
	callback: (event: KeyboardEvent) => void,
) => {
	const hotkeysArray = hotkeys.split('+');

	let pressedKeys: Record<string, boolean> = {};

	const onKeyDown = (evt: KeyboardEvent) => {
		const keyName = getUnifiedKeyName(evt.code);
		if (keyName === null) return;

		// Do not handle already pressed keys
		if (pressedKeys[keyName]) return;

		pressedKeys[keyName] = true;

		const isHotkeysPressed =
			hotkeysArray.length > 0 && hotkeysArray.every((key) => pressedKeys[key]);

		// Trigger callback only when pressed exact keys, with no unnecessary keys
		const isPressedKeysNumberMatch =
			Object.values(pressedKeys).filter((isPressed) => isPressed).length ===
			hotkeysArray.length;

		if (isHotkeysPressed && isPressedKeysNumberMatch) {
			pressedKeys = {};
			callback(evt);
		}
	};

	const onKeyUp = (evt: KeyboardEvent) => {
		const keyName = getUnifiedKeyName(evt.code);
		if (keyName === null) return;

		if (pressedKeys[keyName]) {
			pressedKeys[keyName] = false;
		}
	};

	// Reset pressed keys by
	const onBlur = () => {
		pressedKeys = {};
	};

	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);
	document.addEventListener('blur', onBlur);
	return () => {
		document.removeEventListener('keydown', onKeyDown);
		document.removeEventListener('keyup', onKeyUp);
		document.removeEventListener('blur', onBlur);
	};
};
