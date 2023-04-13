import React, { FC, useEffect, useState } from 'react';

import { LayoutFlow } from '../../layouts/LayoutFlow/LayoutFlow';
import { Textinput } from '../../primitives/Textinput/Textinput.bundle/desktop';
import { Button } from '../../primitives/Button/Button.bundle/universal';

import { getUnifiedKeyName } from './utils';

export type HotkeyProps = {
	value: string | null;
	onChange: (value: string | null) => void;
};

export const Hotkey: FC<HotkeyProps> = ({ value, onChange }) => {
	const [isFocus, setIsFocus] = useState(false);

	useEffect(() => {
		if (!isFocus) return;

		let pressedKeys: Record<string, boolean> = {};

		const onKeyDown = (evt: KeyboardEvent) => {
			const keyName = getUnifiedKeyName(evt.code);
			if (keyName === null) return;

			// Do not record tab key, to keep keyboard navigation works
			if (keyName === 'Tab') {
				pressedKeys = {};
				return;
			}

			evt.preventDefault();
			pressedKeys[keyName] = true;
		};

		const onKeyUp = (evt: KeyboardEvent) => {
			const keyName = getUnifiedKeyName(evt.code);
			if (keyName === null) return;

			// Reset keys
			if (keyName === 'Escape' && Object.values(pressedKeys).length === 1) {
				pressedKeys = {};
				onChange(null);
				return;
			}

			evt.preventDefault();

			// Change state for recorded keys, but do not insert new keys
			if (pressedKeys[keyName]) {
				pressedKeys[keyName] = false;
			}

			// Update hotkeys
			const pressedKeysValues = Object.values(pressedKeys);
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
