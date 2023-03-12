import { useCallback, useEffect, useState } from 'react';
import { isEqual } from 'lodash';

import { getTTSLanguages } from '../../requests/backend/tts/getTTSLanguages';
import { onAppConfigUpdated } from '../../requests/common/appConfigUpdate';

export const useTTSLanguages = () => {
	const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);

	// Get languages
	useEffect(() => {
		getTTSLanguages().then(setSupportedLanguages);
	}, []);

	// Update languages by change TTS module
	useEffect(() => {
		const cleanup = onAppConfigUpdated(() => {
			getTTSLanguages().then((langs) => {
				setSupportedLanguages((value) => {
					return isEqual(value, langs) ? value : langs;
				});
			});
		});

		return cleanup;
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
