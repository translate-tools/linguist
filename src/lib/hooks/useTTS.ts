import { useRef, useEffect, useState } from 'react';

import { TTSPlayer } from '../TTSPlayer';
import { getTTS } from '../../requests/backend/getTTS';

/**
 * TTS is text to speak
 *
 * Use player for speak text
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
