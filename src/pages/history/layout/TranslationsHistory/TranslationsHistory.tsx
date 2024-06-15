import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';
import { Spinner } from 'react-elegant-ui/esm/components/Spinner/Spinner.bundle/desktop';
import InfiniteScroll from 'react-infinite-scroller';
import { cn } from '@bem-react/classname';

import { DictionaryButton } from '../../../../components/controls/DictionaryButton/DictionaryButton';
import { LayoutFlow } from '../../../../components/layouts/LayoutFlow/LayoutFlow';
import { TranslationCard } from '../../../../components/layouts/TranslationCard/TranslationCard';
import { Button } from '../../../../components/primitives/Button/Button.bundle/universal';
import { Icon } from '../../../../components/primitives/Icon/Icon.bundle/desktop';
import { Notification } from '../../../../components/primitives/Notification/Notification.bundle/universal';
import { Textinput } from '../../../../components/primitives/Textinput/Textinput.bundle/desktop';
import { useConcurrentTTS } from '../../../../lib/hooks/useConcurrentTTS';
import { useConfirm } from '../../../../lib/hooks/useConfirm';
import { useDebouncedInput } from '../../../../lib/hooks/useDebouncedInput';
import { useKeyboardModifiers } from '../../../../lib/hooks/useKeyboardModifiers';
import { buildLink, getLocalizedNode, getMessage } from '../../../../lib/language';
import { clearTranslationHistory } from '../../../../requests/backend/history/clearTranslationHistory';
import {
	ITranslationHistoryEntryWithKey,
	TranslationHistoryFetcherOptions,
} from '../../../../requests/backend/history/data';
import { deleteTranslationHistoryEntry } from '../../../../requests/backend/history/deleteTranslationHistoryEntry';

import './TranslationsHistory.css';

export const cnTranslationsHistory = cn('TranslationsHistory');

export type TranslationsHistoryFetcher = (
	options?: TranslationHistoryFetcherOptions,
) => void;

export type TranslationsHistoryProps = {
	translations: ITranslationHistoryEntryWithKey[];
	hasMoreTranslations: boolean;
	requestTranslations: TranslationsHistoryFetcher;
	isHistoryEnabled: boolean;
};

const TRANSLATIONS_PER_PAGE = 100;
export const TranslationsHistory: FC<TranslationsHistoryProps> = ({
	translations,
	hasMoreTranslations,
	requestTranslations,
	isHistoryEnabled,
}) => {
	const searchInput = useDebouncedInput('');
	const search = searchInput.debouncedValue;

	const scrollDataRef = useRef<{
		cursor: null | number;
	}>({
		cursor: null,
	});

	// Reset scroll cursor by change filters
	useEffect(() => {
		scrollDataRef.current.cursor = null;
	}, [search]);

	const updateTranslations = useCallback(() => {
		const { cursor } = scrollDataRef.current;

		requestTranslations({
			search,
			limit: TRANSLATIONS_PER_PAGE,
			limitFrom: cursor !== null ? cursor - 1 : undefined,
		});
	}, [requestTranslations, search]);

	const getMoreTranslations = useCallback(() => {
		const lastItemId =
			translations.length === 0 ? null : translations[translations.length - 1].key;
		scrollDataRef.current.cursor = lastItemId;

		updateTranslations();
	}, [translations, updateTranslations]);

	useEffect(() => {
		getMoreTranslations();
		// Call once to init component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		updateTranslations();
	}, [updateTranslations]);

	const { toggleTTS, ttsPlayer, ttsState } = useConcurrentTTS();

	// Stop TTS by change translations
	useEffect(() => {
		const currentPlayedTTS = ttsState.current ? ttsState.current.id : null;

		// Stop for empty translations or when current played entry removed
		if (
			translations.length === 0 ||
			(currentPlayedTTS &&
				!translations.find(({ key }) => key === currentPlayedTTS))
		) {
			ttsPlayer.stop();
		}
	}, [translations, ttsPlayer, ttsState]);

	const [checkedItems, setCheckedItems] = useState<Record<number, any>>({});

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

	const keyboardModifiers = useKeyboardModifiers();

	// Toggle checkbox
	const lastCheckbox = useRef<null | number>(null);
	const toggleCheckbox = useCallback(
		(id: number) => {
			const isSelected = id in checkedItems;
			const isMultiSelect = keyboardModifiers.shift;

			const getTranslationsKeysRange = (a: number, b: number) => {
				const keys: number[] = [];

				let checkpoints = 0;
				for (const item of translations) {
					const isCheckpoint = item.key === a || item.key === b;
					if (isCheckpoint) {
						checkpoints++;
					}

					// Skip if checkpoint still didn't found
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
					? getTranslationsKeysRange(lastCheckbox.current, id)
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
		[checkedItems, keyboardModifiers, translations],
	);

	const selectedItemsNumber = Object.keys(checkedItems).length;
	const toggleSelectionAll = useCallback(() => {
		// Empty selection
		const selectedItems: Record<number, any> = {};

		const shouldSelectAll =
			selectedItemsNumber === 0 || selectedItemsNumber < translations.length;
		if (shouldSelectAll) {
			// Select all
			translations.forEach(({ key }) => {
				selectedItems[key] = true;
			});
		}

		setCheckedItems(selectedItems);
	}, [selectedItemsNumber, translations]);

	const requestConfirm = useConfirm();

	const deleteEntry = useCallback(
		(id: number) => {
			requestConfirm({
				message: getMessage('history_message_deleteEntryConfirmation'),
				onAccept: () => {
					deleteTranslationHistoryEntry(id).then(updateTranslations);
				},
			});
		},
		[requestConfirm, updateTranslations],
	);

	const deleteSelectedEntries = useCallback(() => {
		const selectedEntriesId = Object.keys(checkedItems).map(Number);
		if (selectedEntriesId.length === 0) return;

		const deleteSelected = () => {
			Promise.all(
				selectedEntriesId.map((id) => deleteTranslationHistoryEntry(id)),
			).finally(updateTranslations);
		};

		const checkedItemsNumber = String(Object.keys(checkedItems).length);
		requestConfirm({
			message: getMessage(
				'history_message_deleteSelectedEntriesConfirmation',
				checkedItemsNumber,
			),
			onAccept: deleteSelected,
		});
	}, [checkedItems, requestConfirm, updateTranslations]);

	const deleteAllEntries = useCallback(() => {
		// TODO: add modal window to select options to delete
		requestConfirm({
			message: getMessage('history_message_clearHistoryConfirmation'),
			onAccept: () => {
				clearTranslationHistory().then(updateTranslations);
			},
		});
	}, [requestConfirm, updateTranslations]);

	let noEntriesMessage: string | null = null;
	if (translations.length === 0) {
		const isEmptyFilters = search === '';
		noEntriesMessage = isEmptyFilters
			? getMessage('history_message_emptyEntries')
			: getMessage('history_message_entriesNotFound');
	}

	const hasSelectedTranslations = selectedItemsNumber > 0;
	const isIndeterminateTranslationsSelection =
		hasSelectedTranslations &&
		translations.length !== 0 &&
		translations.length !== selectedItemsNumber;

	return (
		<div className={cnTranslationsHistory()}>
			<LayoutFlow indent="xl">
				{!isHistoryEnabled && (
					<Notification type="default">
						{getLocalizedNode({
							messageName: 'history_notification_disabled',
							slots: {
								preferences: buildLink(`/pages/options/options.html`),
							},
						})}
					</Notification>
				)}
				<Textinput
					hasClear
					className={cnTranslationsHistory('Search')}
					placeholder={getMessage('history_searchPlaceholder')}
					value={searchInput.value}
					onInputText={searchInput.setValue}
					onClearClick={() => searchInput.setValue('')}
				/>

				<LayoutFlow direction="horizontal" indent="l">
					<Checkbox
						indeterminate={isIndeterminateTranslationsSelection}
						checked={hasSelectedTranslations}
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

				{noEntriesMessage && (
					<div className={cnTranslationsHistory('EmptyResults')}>
						{noEntriesMessage}
					</div>
				)}

				<InfiniteScroll
					loadMore={getMoreTranslations}
					hasMore={hasMoreTranslations}
					threshold={50}
					loader={
						<div
							className={cnTranslationsHistory('InfinityScrollLoader')}
							key="loader"
						>
							<Spinner view="primitive" progress />
						</div>
					}
				>
					{translations.map(({ data, key }) => {
						const { translation, timestamp } = data;
						return (
							<TranslationCard
								key={key}
								translation={translation}
								timestamp={timestamp}
								onPressTTS={(target) => {
									if (target === 'original') {
										toggleTTS(
											key,
											translation.from,
											translation.originalText,
										);
									} else {
										toggleTTS(
											key,
											translation.to,
											translation.translatedText,
										);
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
									<>
										<DictionaryButton translation={translation} />
										<Button
											view="clear"
											size="s"
											onPress={() => deleteEntry(key)}
											title={getMessage(
												'common_action_removeFromDictionary',
											)}
											content="icon"
										>
											<Icon glyph="delete" scalable={false} />
										</Button>
									</>
								}
							/>
						);
					})}
				</InfiniteScroll>
			</LayoutFlow>
		</div>
	);
};
