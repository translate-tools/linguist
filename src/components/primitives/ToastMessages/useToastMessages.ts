import { useCallback, useMemo, useRef, useState } from 'react';
import { useEqualMemo } from 'react-elegant-ui/esm/hooks/useEqualMemo';

export type Message = {
	text: string;
	type: 'error' | 'info';
};

export type PublicMessage = Message & {
	id: symbol;
};

interface Options {
	hideDelay?: number;
}

/**
 * Messages manager
 */
export const useToastMessages = ({ hideDelay = 3000 }: Options) => {
	const [messagePointers, setMessagePointers] = useState<symbol[]>([]);

	// Map for keep order
	const messagesMap = useEqualMemo(
		() =>
			new Map<
				symbol,
				Message & {
					timer: null | number;
				}
			>(),
		[],
	);

	const updateMessageState = useCallback(() => {
		const messagePointers = [];

		// We can't use spread, then use iterate
		for (const ptr of messagesMap.keys()) {
			messagePointers.push(ptr);
		}

		setMessagePointers(messagePointers);
	}, [messagesMap]);

	const deleteMessage = useCallback(
		(ptr: symbol) => {
			const message = messagesMap.get(ptr);

			// Skip empty messages
			if (message === undefined) return;

			if (message.timer !== null) {
				window.clearTimeout(message.timer);
				message.timer = null;
			}

			if (messagesMap.delete(ptr)) {
				updateMessageState();
			}
		},
		[messagesMap, updateMessageState],
	);

	const globalErrorMessageHalt = useRef(false);
	const toggleMessageHalt = useCallback(
		(isHalted: boolean, msgPtr?: symbol) => {
			if (msgPtr === undefined) {
				// Toggle all

				// Skip if already have this state
				if (isHalted === globalErrorMessageHalt.current) return;

				globalErrorMessageHalt.current = isHalted;
				for (const messagePtr of messagesMap.keys()) {
					toggleMessageHalt(isHalted, messagePtr);
				}
			} else {
				// Toggle entry
				const message = messagesMap.get(msgPtr);

				// Skip empty messages
				if (message === undefined) return;

				if (isHalted) {
					if (message.timer !== null) {
						window.clearTimeout(message.timer);
						message.timer = null;
					}
				} else {
					if (message.timer === null) {
						message.timer = window.setTimeout(() => {
							deleteMessage(msgPtr);
						}, hideDelay);
					}
				}
			}
		},
		[deleteMessage, messagesMap, hideDelay],
	);

	const addMessage = useCallback(
		(text: string, type: 'error' | 'info') => {
			const messagePtr = Symbol();
			const message = {
				text,
				type,
				timer: null,
			};

			messagesMap.set(messagePtr, message);
			updateMessageState();

			// Close after delay
			toggleMessageHalt(false, messagePtr);
		},
		[messagesMap, toggleMessageHalt, updateMessageState],
	);

	//
	// Public API
	//

	const messages: PublicMessage[] = useMemo(() => {
		const messages: PublicMessage[] = [];

		messagePointers.map((ptr) => {
			const message = messagesMap.get(ptr);

			if (message === undefined) return;

			const { text, type } = message;

			messages.push({ text, type, id: ptr });
		});

		return messages;
	}, [messagePointers, messagesMap]);

	const haltMessages = useCallback(
		(state: boolean) => toggleMessageHalt(state),
		[toggleMessageHalt],
	);

	return {
		messages,
		addMessage,
		deleteMessage,
		haltMessages,
	};
};
