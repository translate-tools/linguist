import { useRef, useEffect } from 'react';

type KeyboardModifiers = {
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
	shift: boolean;
};

export const useKeyboardModifiers = (): Readonly<KeyboardModifiers> => {
	const modifiersRef = useRef<KeyboardModifiers>({
		ctrl: false,
		meta: false,
		alt: false,
		shift: false,
	});

	useEffect(() => {
		const modifiers = modifiersRef.current;

		const keyboardHandler = (evt: KeyboardEvent) => {
			modifiers.ctrl = evt.ctrlKey;
			modifiers.meta = evt.metaKey;
			modifiers.alt = evt.altKey;
			modifiers.shift = evt.shiftKey;
		};

		document.addEventListener('keydown', keyboardHandler);
		document.addEventListener('keyup', keyboardHandler);
		return () => {
			document.addEventListener('keydown', keyboardHandler);
			document.addEventListener('keyup', keyboardHandler);

			modifiers.ctrl = false;
			modifiers.meta = false;
			modifiers.alt = false;
			modifiers.shift = false;
		};
	}, []);

	return modifiersRef.current;
};
