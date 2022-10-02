import { useCallback } from 'react';

import { useKeyboardModifiers } from './useKeyboardModifiers';

export const useConfirm = () => {
	const keyboardModifiers = useKeyboardModifiers();

	return useCallback(
		({ message, onAccept }: { message: string; onAccept: () => void }) => {
			if (keyboardModifiers.ctrl || confirm(message)) {
				onAccept();
			}
		},
		[keyboardModifiers.ctrl],
	);
};
