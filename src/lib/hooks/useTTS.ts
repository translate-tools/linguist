import { useRef, useEffect, useState, useMemo } from 'react';

import { TTSPlayer } from '../TTSPlayer';
import { getTTS } from '../../requests/backend/getTTS';

/**
 * TTS is text to speak
 *
 * Use player to speak text
 */
export const useTTS = (lang: string, text: string | null) => {
	const player = useRef<TTSPlayer>(null as any);
	if (player.current === null) {
		player.current = new TTSPlayer(getTTS);
	}

	useEffect(() => {
		player.current.setOptions(lang, text);
	}, [lang, text]);

	const [isLoading, setIsLoading] = useState(player.current.getIsLoading());
	useEffect(() => {
		player.current.onLoading = setIsLoading;
		() => {
			player.current.onLoading = null;
		};
	}, []);

	const { play, stop, isPlayed } = player.current;
	return { play, stop, isPlayed, isLoading };
};

type TTSItem = { lang: string; text: string | null };

// TODO: update by loading state change. Maybe we have to just manage collection of `useTTS`?
/**
 * TTS is text to speak
 *
 * Return TTS players which stop all other when start playing
 */
export const useConcurrentTTS = <T extends string = string>(
	ttsList: Record<T, TTSItem>,
) => {
	const players = useRef<Record<string, TTSPlayer>>({});
	const currentPlayer = useRef<TTSPlayer | null>(null);

	// Sync players with data list
	useMemo(() => {
		// Set and update players
		for (const key in ttsList) {
			if (!(key in players.current)) {
				const player = new TTSPlayer(getTTS);
				players.current[key] = new Proxy(player, {
					// Stop other player while play current
					get(target, key) {
						return ['play', 'toggle'].indexOf(key as any) === -1
							? (target as any)[key]
							: (...args: any[]) => {
								if (
									currentPlayer.current !== null &&
										currentPlayer.current !== target
								) {
									currentPlayer.current.stop();
								}

								currentPlayer.current = target;
								(target as any)[key](...args);
							  };
					},
				}) as TTSPlayer;
			}

			const { lang, text } = ttsList[key];
			players.current[key].setOptions(lang, text);
		}

		// Remove players
		Object.keys(players.current).forEach((key) => {
			if (key in ttsList) return;
			delete players.current[key];
		});
	}, [ttsList]);

	return players.current as Record<T, TTSPlayer>;
};
