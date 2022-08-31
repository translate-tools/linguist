import { cn } from '@bem-react/classname';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';
import { Button } from '../../components/Button/Button.bundle/universal';
import { Icon } from '../../components/Icon/Icon.bundle/desktop';
import { LayoutFlow } from '../../components/LayoutFlow/LayoutFlow';
import { Textinput } from '../../components/Textinput/Textinput.bundle/desktop';
import { useTranslateFavorite } from '../../lib/hooks/useTranslateFavorite';
import { getMessage } from '../../lib/language';
import {
	TranslationEntry,
	useConcurrentTTS,
} from '../../pages/dictionary/layout/DictionaryPage';
import { clearTranslationHistory } from '../../requests/backend/history/clearTranslationHistory';

import { ITranslationHistoryEntryWithKey } from '../../requests/backend/history/data';
import { deleteTranslationHistoryEntry } from '../../requests/backend/history/deleteTranslationHistoryEntry';
import { ITranslation } from '../../types/translation/Translation';

import './TranslationsHistory.css';

export const cnTranslationsHistory = cn('TranslationsHistory');

// TODO: move to another file
export const BookmarksButton: FC<{ translation: ITranslation }> = ({ translation }) => {
	const { isFavorite, toggleFavorite } = useTranslateFavorite(translation);

	return (
		<Button
			view="clear"
			size="s"
			content="icon"
			onPress={toggleFavorite}
			title={getMessage(
				isFavorite ? 'bookmarkButton_delete' : 'bookmarkButton_add',
			)}
		>
			<Icon glyph={isFavorite ? 'bookmark' : 'bookmark-border'} scalable={false} />
		</Button>
	);
};

export type TranslationsHistoryFetcher = (options?: { search: string }) => void;

export type TranslationsHistoryProps = {
	translations: ITranslationHistoryEntryWithKey[];
	requestTranslations: TranslationsHistoryFetcher;
};

export const TranslationsHistory: FC<TranslationsHistoryProps> = ({
	translations,
	requestTranslations,
}) => {
	const [search, setSearch] = useState('');

	const updateTranslations = useCallback(
		() => requestTranslations({ search }),
		[requestTranslations, search],
	);

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

	const [checkedItems, setCheckedItems] = useState<Record<number, any>>({});

	// Track shift key press state
	const isShiftPressed = useRef(false);
	useEffect(() => {
		const updateShiftState = (event: KeyboardEvent) => {
			isShiftPressed.current = event.shiftKey;
		};

		const onVisibilityCHange = () => {
			if (document.visibilityState !== 'visible') {
				isShiftPressed.current = false;
			}
		};

		document.addEventListener('keydown', updateShiftState);
		document.addEventListener('keyup', updateShiftState);

		document.addEventListener('visibilitychange', onVisibilityCHange);

		return () => {
			document.removeEventListener('keydown', updateShiftState);
			document.removeEventListener('keyup', updateShiftState);

			document.removeEventListener('visibilitychange', onVisibilityCHange);
		};
	}, []);

	// Remove checked items that no more exists
	useEffect(() => {
		const notExistItems = { ...checkedItems };

		translations.forEach(({ key }) => {
			delete notExistItems[key];
		});

		const notExistsKeys = Object.keys(notExistItems);
		if (notExistsKeys.length > 0) {
			const fixedDictionary = { ...checkedItems };

			notExistsKeys.forEach((key) => {
				delete fixedDictionary[key as any];
			});

			setCheckedItems(fixedDictionary);
		}

		// Not depends of checkedItems, required only `checkedItems` while `translations` change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [translations]);

	// Toggle checkbox
	const lastCheckbox = useRef<null | number>(null);
	const toggleCheckbox = useCallback(
		(id: number) => {
			const isSelected = id in checkedItems;
			const isMultiSelect = isShiftPressed.current;

			const getRange = (a: number, b: number) => {
				const keys: number[] = [];

				let checkpoints = 0;
				for (const item of translations) {
					const isCheckpoint = item.key === a || item.key === b;
					if (isCheckpoint) {
						checkpoints++;
					}

					if (checkpoints === 0) continue;

					keys.push(item.key);

					const isFirstAndLast = item.key === a && item.key === b;
					if (checkpoints > 1 || isFirstAndLast) break;
				}

				return keys;
			};

			const newState = { ...checkedItems };

			const keysList =
				isMultiSelect && lastCheckbox.current
					? getRange(lastCheckbox.current, id)
					: [id];
			keysList.forEach((id) => {
				if (isSelected) {
					delete newState[id];
				} else {
					newState[id] = true;
				}
			});

			lastCheckbox.current = id;
			setCheckedItems(newState);
		},
		[checkedItems, translations],
	);

	const selectedItemsNumber = Object.keys(checkedItems).length;
	const isNotEmptySelection = selectedItemsNumber > 0 ? true : false;
	const indeterminateSelection =
		isNotEmptySelection &&
		translations.length !== 0 &&
		translations.length !== selectedItemsNumber;

	const toggleSelectionAll = useCallback(() => {
		console.log('toggleSelectionAll');

		const newState: Record<number, any> = {};

		const isShouldSelectAll =
			selectedItemsNumber === 0 || selectedItemsNumber < translations.length;
		if (isShouldSelectAll) {
			translations.forEach(({ key }) => {
				newState[key] = true;
			});
		}

		setCheckedItems(newState);
	}, [selectedItemsNumber, translations]);

	const deleteEntry = useCallback(
		(id: number) => {
			// TODO: add prompt when not pressed ctrl button
			deleteTranslationHistoryEntry(id).then(updateTranslations);
		},
		[updateTranslations],
	);

	const deleteSelectedEntries = useCallback(() => {
		const selectedEntriesId = Object.keys(checkedItems).map(Number);
		if (selectedEntriesId.length === 0) return;

		// TODO: add prompt when not pressed ctrl button
		Promise.all(
			selectedEntriesId.map((id) => deleteTranslationHistoryEntry(id)),
		).finally(updateTranslations);
	}, [checkedItems, updateTranslations]);

	const deleteAllEntries = useCallback(() => {
		// TODO: add prompt when not pressed ctrl button
		// TODO: add modal window to select options to delete
		clearTranslationHistory().then(updateTranslations);
	}, [updateTranslations]);

	return (
		<div className={cnTranslationsHistory()}>
			<LayoutFlow indent="xl">
				<Textinput
					hasClear
					className={cnTranslationsHistory('Search')}
					placeholder={getMessage('history_searchPlaceholder')}
					value={search}
					setValue={setSearch}
					onClearClick={() => setSearch('')}
				/>

				<LayoutFlow direction="horizontal" indent="l">
					<Checkbox
						indeterminate={indeterminateSelection}
						checked={isNotEmptySelection}
						setChecked={toggleSelectionAll}
						disabled={translations.length === 0}
						title={getMessage('history_controls_selectAll')}
					/>

					<Button
						view="default"
						onPress={deleteSelectedEntries}
						disabled={selectedItemsNumber === 0}
					>
						{getMessage('history_controls_deleteSelected')}
					</Button>

					<Button
						view="default"
						onPress={deleteAllEntries}
						disabled={translations.length === 0}
					>
						{getMessage('history_controls_clearHistory')}
					</Button>
				</LayoutFlow>

				{translations.length === 0 && (
					<div className={cnTranslationsHistory('EmptyResults')}>
						{getMessage('history_message_emptyEntries')}
					</div>
				)}
				{translations.map(({ data, key }) => {
					const { translation, timestamp } = data;
					return (
						<TranslationEntry
							key={key}
							translation={translation}
							timestamp={timestamp}
							onPressRemove={() => deleteEntry(key)}
							onPressTTS={(target) => {
								if (target === 'original') {
									toggleTTS(key, translation.from, translation.text);
								} else {
									toggleTTS(key, translation.to, translation.translate);
								}
							}}
							headStartSlot={
								<Checkbox
									checked={key in checkedItems}
									setChecked={() => toggleCheckbox(key)}
									title={getMessage('history_control_selectEntry')}
								/>
							}
							controlPanelSlot={
								<BookmarksButton translation={translation} />
							}
						/>
					);
				})}
			</LayoutFlow>
		</div>
	);
};
