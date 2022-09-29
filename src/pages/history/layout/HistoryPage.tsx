import { cn } from '@bem-react/classname';
import React, { FC, useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
	>(null);

	const requestTranslations: TranslationsHistoryFetcher = useCallback((options) => {
		getTranslationHistoryEntries(options).then((entries) => {
			setTranslations(entries);
		});
	}, []);

	useEffect(() => {
		requestTranslations();
	}, [requestTranslations]);

	// Wait render nested components with new props
	const [isLoaded, setIsLoaded] = useState(false);
	useLayoutEffect(() => {
		if (translations !== null) {
			setIsLoaded(true);
		}
	}, [translations]);

	return (
		<Page loading={!isLoaded}>
			<div className={cnHistoryPage()}>
				<TranslationsHistory
					{...{ translations: translations || [], requestTranslations }}
				/>
			</div>
		</Page>
	);
};
