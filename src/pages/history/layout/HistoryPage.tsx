import React, { FC, useCallback, useEffect, useState } from 'react';
import { TranslationsHistory } from '../../../layouts/History/TranslationsHistory';
import { Page } from '../../../layouts/Page/Page';
import { ITranslationHistoryEntryWithKey } from '../../../requests/backend/history/data';
import { getTranslationHistoryEntries } from '../../../requests/backend/history/getHistoryEntries';

export const HistoryPage: FC = () => {
	const [translations, setTranslations] = useState<
		null | ITranslationHistoryEntryWithKey[]
	>();

	const updateTranslations = useCallback(() => {
		getTranslationHistoryEntries().then((entries) => {
			setTranslations(entries);
		});
	}, []);

	useEffect(() => {
		updateTranslations();
	}, [updateTranslations]);

	return (
		<Page loading={translations === null}>
			<TranslationsHistory
				{...{ translations: translations || [], updateTranslations }}
			/>
		</Page>
	);
};
