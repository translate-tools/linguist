import { useEffect, useRef, useState } from 'react';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { useTTS } from './useTTS';

/**
 * Create TTS instance to speak few texts by call hook
 *
 * At one time may play only one player, another will be stopped
 */
export const useConcurrentTTS = () => {
	const [TTSData, setTTSData] = useState<{
		readonly id: any;
		readonly lang: string;
		readonly text: string;
	} | null>(null);

	const ttsState = useRef(TTSData);
	ttsState.current = TTSData ? { ...TTSData } : null;

	const { lang: ttsLang = null, text: ttsText = null } = TTSData || {};
	const ttsPlayer = useTTS(ttsLang, ttsText);

	// Play by change TTSData
	useEffect(() => {
		if (TTSData === null) return;
		ttsPlayer.play();
	}, [TTSData, ttsPlayer]);

	// Stop TTS by change entries list
	useEffect(() => {
		ttsPlayer.stop();
	}, [ttsPlayer]);

	const toggleTTS = useImmutableCallback(
		(id: any, lang: string, text: string) => {
			const request = { id, lang, text };
			const isSameObject =
				TTSData !== null &&
				Object.keys(request).every(
					(key) => (request as any)[key] === (TTSData as any)[key],
				);

			if (isSameObject) {
				if (ttsPlayer.isPlayed) {
					ttsPlayer.stop();
				} else {
					ttsPlayer.play();
				}
			} else {
				ttsPlayer.stop();
				setTTSData({ id, lang, text });
			}
		},
		[TTSData, ttsPlayer],
	);

	return {
		ttsState,
		ttsPlayer,
		toggleTTS,
	} as const;
};
