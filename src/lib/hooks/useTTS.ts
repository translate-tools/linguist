import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { QueuePlayer } from '../QueuePlayer';
import { getTTS } from '../../requests/backend/getTTS';

/**
 * TTS is text to speak
 *
 * Use player for speak text
 */
export const useTTS = (lang: string, text: string) => {
	const player = useRef<QueuePlayer | null>(null);

	// Update state context
	const stateContext = useRef({});
	useEffect(() => {
		// Update context
		const newContext = {};
		stateContext.current = newContext;

		// Stop current player
		if (player.current !== null) {
			player.current.stop();
			player.current = null;
		}
	}, [lang, text]);

	const play = useImmutableCallback(async () => {
		// Update player
		if (player.current === null) {
			const localContext = stateContext.current;

			await getTTS({ lang, text }).then((urls) => {
				// Skip by change context
				if (localContext !== stateContext.current) return;

				// Stop current player
				if (player.current !== null) {
					player.current.stop();
				}

				player.current = new QueuePlayer(urls);
			});

			// Skip by change context
			if (localContext !== stateContext.current) return;
		}

		if (player.current !== null) {
			player.current.play();
		}
	}, [lang, text]);

	const stop = useCallback(() => {
		if (player.current !== null) {
			player.current.stop();
		}
	}, []);

	const isPlayed = useCallback(() => {
		if (player.current !== null) {
			return player.current.isPlayed();
		}

		return false;
	}, []);

	return useMemo(() => ({ play, stop, isPlayed } as const), [isPlayed, play, stop]);
};
