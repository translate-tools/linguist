import { useCallback } from 'react';

import { useKeyboardModifiers } from './useKeyboardModifiers';

export const useConfirm = () => {
	const keyboardModifiers = useKeyboardModifiers();

	return useCallback(
		({ message, onAccept }: { message: string; onAccept: () => void }) => {
			const isForced = keyboardModifiers.ctrl;
			const isAccepted = isForced || confirm(message);
			if (isAccepted) {
				onAccept();
			}
		},
		[keyboardModifiers.ctrl],
	);
};
