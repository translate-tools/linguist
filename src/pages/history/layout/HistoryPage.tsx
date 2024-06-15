import React, { FC, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { isEqual } from 'lodash';
import { cn } from '@bem-react/classname';

import { Page } from '../../../components/layouts/Page/Page';
import { getConfig } from '../../../requests/backend/getConfig';
import { ITranslationHistoryEntryWithKey } from '../../../requests/backend/history/data';
import { getTranslationHistoryEntries } from '../../../requests/backend/history/getHistoryEntries';

import {
	TranslationsHistory,
	TranslationsHistoryFetcher,
} from './TranslationsHistory/TranslationsHistory';

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

	const [isHistoryEnabled, setIsHistoryEnabled] = useState<null | boolean>(null);
	useEffect(() => {
		getConfig().then((config) => {
			setIsHistoryEnabled(config.history.enabled);
		});
	}, []);

	// Wait render nested components with new props
	const [isLoaded, setIsLoaded] = useState(false);
	useLayoutEffect(() => {
		if (isHistoryEnabled === null) return;
		if (translations === null) return;

		setIsLoaded(true);
	}, [translations, isHistoryEnabled]);

	return (
		<Page loading={!isLoaded} renderWhileLoading>
			<div className={cnHistoryPage()}>
				<TranslationsHistory
					{...{
						translations: translations || [],
						hasMoreTranslations,
						requestTranslations,
						isHistoryEnabled: Boolean(isHistoryEnabled),
					}}
				/>
			</div>
		</Page>
	);
};
