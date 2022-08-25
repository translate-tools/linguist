import React, { FC, useEffect } from 'react';
import {
	TranslationEntry,
	useConcurrentTTS,
} from '../../pages/dictionary/layout/DictionaryPage';

import { ITranslationHistoryEntryWithKey } from '../../requests/backend/history/data';

export type TranslationsHistoryProps = {
	translations: ITranslationHistoryEntryWithKey[];
	updateTranslations: () => void;
};

export const TranslationsHistory: FC<TranslationsHistoryProps> = ({
	translations,
	updateTranslations,
}) => {
	useEffect(() => {
		updateTranslations();
	}, [updateTranslations]);

	const { toggleTTS, ttsPlayer, ttsState } = useConcurrentTTS();

	// Stop TTS by change translations
	useEffect(() => {
		const currentPlayedTTS = ttsState.current ? ttsState.current.id : null;

		// Stop for empty translations or when current played entry removed
		if (
			translations === null ||
			(currentPlayedTTS &&
				!translations.find(({ key }) => key === currentPlayedTTS))
		) {
			ttsPlayer.stop();
		}
	}, [translations, ttsPlayer, ttsState]);

	// return <pre>{JSON.stringify(translations, null, 4)}</pre>;
	return (
		<div>
			{translations.map(({ data, key }) => {
				const { translation, timestamp } = data;
				return (
					<TranslationEntry
						key={key}
						translation={translation}
						timestamp={timestamp}
						onPressTTS={(target) => {
							if (target === 'original') {
								toggleTTS(key, translation.from, translation.text);
							} else {
								toggleTTS(key, translation.to, translation.translate);
							}
						}}
					/>
				);
			})}
		</div>
	);
};
