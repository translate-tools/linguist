import { useEffect, useRef } from 'react';

type KeyboardModifiers = {
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
	shift: boolean;
};

/**
 * Return immutable object equal to ref, that contains modifiers state
 */
export const useKeyboardModifiers = (): Readonly<KeyboardModifiers> => {
	const modifiersRef = useRef<KeyboardModifiers>({
		ctrl: false,
		meta: false,
		alt: false,
		shift: false,
	});

	useEffect(() => {
		const modifiers = modifiersRef.current;

		const resetModifiers = () => {
			modifiers.ctrl = false;
			modifiers.meta = false;
			modifiers.alt = false;
			modifiers.shift = false;
		};

		const keyboardHandler = (evt: KeyboardEvent) => {
			modifiers.ctrl = evt.ctrlKey;
			modifiers.meta = evt.metaKey;
			modifiers.alt = evt.altKey;
			modifiers.shift = evt.shiftKey;
		};

		const onVisibilityCHange = () => {
			// Reset state by open another tab
			if (document.visibilityState !== 'visible') {
				resetModifiers();
			}
		};

		document.addEventListener('keydown', keyboardHandler);
		document.addEventListener('keyup', keyboardHandler);
		document.addEventListener('visibilitychange', onVisibilityCHange);

		return () => {
			document.removeEventListener('keydown', keyboardHandler);
			document.removeEventListener('keyup', keyboardHandler);
			document.removeEventListener('visibilitychange', onVisibilityCHange);

			resetModifiers();
		};
	}, []);

	return modifiersRef.current;
};
