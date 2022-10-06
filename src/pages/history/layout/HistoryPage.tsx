import React, { FC, useCallback, useLayoutEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { isEqual } from 'lodash';

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

	const [hasMoreTranslations, setIsHasMoreTranslations] = useState(true);
	const requestTranslations: TranslationsHistoryFetcher = useCallback((options) => {
		getTranslationHistoryEntries(options).then((entries) => {
			setTranslations((currentEntries) => {
				// Check should we try load more data or not
				const hasChanges =
					currentEntries === null ||
					currentEntries.length !== entries.length ||
					!isEqual(currentEntries, entries);
				setIsHasMoreTranslations(hasChanges);

				return entries;
			});
		});
	}, []);

	// Wait render nested components with new props
	const [isLoaded, setIsLoaded] = useState(false);
	useLayoutEffect(() => {
		if (translations !== null) {
			setIsLoaded(true);
		}
	}, [translations]);

	return (
		<Page loading={!isLoaded} renderWhileLoading>
			<div className={cnHistoryPage()}>
				<TranslationsHistory
					{...{
						translations: translations || [],
						hasMoreTranslations,
						requestTranslations,
					}}
				/>
			</div>
		</Page>
	);
};
