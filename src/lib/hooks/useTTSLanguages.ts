import { useCallback, useEffect, useState } from 'react';
import { getTTSLanguages } from '../../requests/backend/tts/getTTSLanguages';

// TODO: update languages by change TTS module
export const useTTSLanguages = () => {
	const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);

	// Get languages
	useEffect(() => {
		getTTSLanguages().then(setSupportedLanguages);
	}, []);

	const isSupportedLanguage = useCallback(
		(lang: string) => supportedLanguages.includes(lang),
		[supportedLanguages],
	);

	return {
		supportedLanguages,
		isSupportedLanguage,
	};
};
