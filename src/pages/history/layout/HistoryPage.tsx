import { cn } from '@bem-react/classname';
import React, { FC, useCallback, useEffect, useState } from 'react';
import {
	TranslationsHistory,
	TranslationsHistoryFetcher,
} from '../../../layouts/History/TranslationsHistory';
import { Page } from '../../../layouts/Page/Page';
import { ITranslationHistoryEntryWithKey } from '../../../requests/backend/history/data';
import { getTranslationHistoryEntries } from '../../../requests/backend/history/getHistoryEntries';

import './HistoryPage.css';

export const cnHistoryPage = cn('HistoryPage');

export const HistoryPage: FC = () => {
	const [translations, setTranslations] = useState<
		null | ITranslationHistoryEntryWithKey[]
	>();

	const requestTranslations: TranslationsHistoryFetcher = useCallback((options) => {
		getTranslationHistoryEntries(options).then((entries) => {
			setTranslations(entries);
		});
	}, []);

	useEffect(() => {
		requestTranslations();
	}, [requestTranslations]);

	return (
		<Page loading={translations === null}>
			<div className={cnHistoryPage()}>
				<TranslationsHistory
					{...{ translations: translations || [], requestTranslations }}
				/>
			</div>
		</Page>
	);
};
