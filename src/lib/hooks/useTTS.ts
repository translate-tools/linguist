import { useCallback, useEffect, useRef, useState } from 'react';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { getTTS } from '../../requests/backend/tts/getTTS';

type PlayerSignal = {
	active: symbol | null;
	setActive: (id: symbol | null) => void;
};

/**
 * TTS is text to speak
 *
 * Use player to speak text
 */
export const useTTS = (
	lang: string | null,
	text: string | null,
	signal?: PlayerSignal,
) => {
	const id = useRef(Symbol('Player'));

	// Send signal to other players will stop
	const setActiveInstance = signal !== undefined ? signal.setActive : null;
	const stopOtherPlayers = useImmutableCallback(() => {
		if (!setActiveInstance) return;

		setActiveInstance(id.current);
	}, [setActiveInstance]);

	const player = useRef<HTMLAudioElement>(null as any);
	if (player.current === null) {
		player.current = new Audio();
	}

	const src = useRef<{ sources: string[]; index: number } | null>(null);
	const nextSourcePusher = useCallback(() => {
		const source = src.current;
		if (source === null) return;

		let isEnd = false;
		if (++source.index >= source.sources.length) {
			source.index = 0;
			isEnd = true;
		}

		const nextSrc = source.sources[source.index];
		player.current.src = nextSrc;

		// Continue play if it is not last segment
		if (!isEnd) {
			player.current.play();
		}
	}, []);

	const [isLoading, setIsLoading] = useState(false);
	const [isPlayed, setIsPlayed] = useState(false);

	useEffect(() => {
		const startLoading = () => setIsLoading(true);
		const stopLoading = () => setIsLoading(false);

		const startPlaying = () => setIsPlayed(true);
		const stopPlaying = () => setIsPlayed(false);

		player.current.addEventListener('ended', nextSourcePusher);

		player.current.addEventListener('waiting', startLoading);
		player.current.addEventListener('canplaythrough', stopLoading);

		player.current.addEventListener('play', startPlaying);
		player.current.addEventListener('pause', stopPlaying);

		return () => {
			player.current.removeEventListener('ended', nextSourcePusher);

			player.current.removeEventListener('waiting', startLoading);
			player.current.removeEventListener('canplaythrough', stopLoading);

			player.current.removeEventListener('play', startPlaying);
			player.current.removeEventListener('pause', stopPlaying);
		};
	}, [nextSourcePusher]);

	const contextSymbol = useRef({});
	const ttsPlaylist = useRef<string[] | null>(null);
	const play = useImmutableCallback(() => {
		stopOtherPlayers();

		if (lang === null || text === null) return;

		contextSymbol.current = {};
		const localContext = contextSymbol.current;

		(async () => {
			setIsLoading(true);
			const urls = ttsPlaylist.current || (await getTTS({ lang, text }));

			if (localContext !== contextSymbol.current) return;

			ttsPlaylist.current = urls;
			src.current = {
				sources: urls,
				index: 0,
			};

			player.current.src = urls[0];
			player.current.play();
		})();
	}, [lang, stopOtherPlayers, text]);

	const stop = useImmutableCallback(() => {
		contextSymbol.current = {};

		player.current.pause();
		player.current.currentTime = 0;

		// Reset playlist
		const playlist = src.current;
		if (playlist !== null) {
			player.current.src = playlist.sources[playlist.index];
		}

		setIsPlayed(false);
	}, []);

	const toggle = useImmutableCallback(() => {
		if (isPlayed) {
			stop();
		} else {
			play();
		}
	}, [isPlayed, play, stop]);

	const simplePlayer = useRef({ play, stop, toggle, isPlayed, isLoading });
	simplePlayer.current.isLoading = isLoading;
	simplePlayer.current.isPlayed = isPlayed;

	// Stop player by signal
	const activeInstance = signal !== undefined ? signal.active : null;
	useEffect(() => {
		if (!activeInstance) return;

		if (activeInstance !== null && activeInstance !== id.current) {
			simplePlayer.current.stop();
		}
	}, [activeInstance]);

	// Stop and update state by change data
	useEffect(() => {
		contextSymbol.current = {};
		ttsPlaylist.current = null;
		stop();
	}, [stop, lang, text]);

	// Stop player by unmount
	useEffect(
		() => () => {
			simplePlayer.current.stop();
		},
		[],
	);

	return simplePlayer.current;
};
