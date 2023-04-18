import React, { FC, useEffect, useState } from 'react';

import { getMessage } from '../../../lib/language';
import { LayoutFlow } from '../../layouts/LayoutFlow/LayoutFlow';
import { Button } from '../../primitives/Button/Button.bundle/universal';
import { Textinput } from '../../primitives/Textinput/Textinput.bundle/desktop';

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
				const keys = Object.keys(pressedKeys);

				const modifierKey = keys.find((key) => key.length > 1);
				if (!modifierKey) {
					pressedKeys = {};
					onChange(null);
					return;
				}

				// Write keys
				const serializedKeys = keys.sort((a, b) => b.length - a.length).join('+');

				pressedKeys = {};
				onChange(serializedKeys);
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
				placeholder={
					isFocus
						? getMessage('component_hotkey_recordPlaceholder')
						: getMessage('component_hotkey_placeholder')
				}
			/>
			<Button onClick={() => onChange(null)}>
				{getMessage('component_hotkey_resetButton')}
			</Button>
		</LayoutFlow>
	);
};
