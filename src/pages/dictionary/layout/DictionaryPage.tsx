import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';
import Papa from 'papaparse';
import { cn } from '@bem-react/classname';
import { getLanguageCodesISO639 } from '@translate-tools/core/languages';

import { LayoutFlow } from '../../../components/layouts/LayoutFlow/LayoutFlow';
import { Page } from '../../../components/layouts/Page/Page';
import { TranslationCard } from '../../../components/layouts/TranslationCard/TranslationCard';
import { Button } from '../../../components/primitives/Button/Button.bundle/desktop';
import { Icon } from '../../../components/primitives/Icon/Icon.bundle/desktop';
import { Select } from '../../../components/primitives/Select/Select.bundle/desktop';
import { Textinput } from '../../../components/primitives/Textinput/Textinput.bundle/desktop';
import { ToastMessages } from '../../../components/primitives/ToastMessages/ToastMessages';
import { useToastMessages } from '../../../components/primitives/ToastMessages/useToastMessages';
import { isMobileBrowser } from '../../../lib/browser';
import { saveFile } from '../../../lib/files';
import { useConcurrentTTS } from '../../../lib/hooks/useConcurrentTTS';
import { getLanguageNameByCode, getMessage } from '../../../lib/language';
import { isTextsContainsSubstring } from '../../../lib/utils';
import { clearTranslations } from '../../../requests/backend/translations/clearTranslations';
import { ITranslationEntryWithKey } from '../../../requests/backend/translations/data';
import { deleteTranslation } from '../../../requests/backend/translations/deleteTranslation';
import { getTranslations } from '../../../requests/backend/translations/getTranslations';
import { ITranslation } from '../../../types/translation/Translation';

import { OptionsPanel } from './OptionsPanel/OptionsPanel';

import './DictionaryPage.css';

export const cnDictionaryPage = cn('DictionaryPage');

const langCodes = getLanguageCodesISO639('v1');

// TODO: implement as option
export interface IDictionaryPageProps {
	confirmDelete?: boolean;
}

// TODO: improve styles

// Future
// TODO: listen updates and refresh data
// TODO: implement pagination

// Features
// TODO: implement edit entries
// TODO: add tab with translate history

/**
 * Represent favorite translates and translate history
 */
export const DictionaryPage: FC<IDictionaryPageProps> = ({ confirmDelete = true }) => {
	const { messages, addMessage, deleteMessage, haltMessages } = useToastMessages({
		hideDelay: 5000,
	});

	const [entries, setEntries] = useState<ITranslationEntryWithKey[] | null>(null);

	const updateData = useCallback(
		() => getTranslations().then((entries) => setEntries(entries)),
		[],
	);

	// Init data
	useEffect(() => {
		updateData();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	//
	// Hooks
	//

	const remove = useImmutableCallback(
		async (idx: number) => {
			if (entries === null) return;

			const entry = entries[idx];
			if (entry === undefined) return;

			const translation = entry.data.translation;

			if (
				confirmDelete &&
				!confirm(
					getMessage('dictionary_deleteConfirmation') +
						'\n\n---\n\n' +
						translation.originalText +
						'\n\n---\n\n' +
						translation.translatedText,
				)
			)
				return;

			await deleteTranslation(entry.key);

			setEntries((state) => {
				if (state !== entries || state === null) return state;

				// Remove from entry from state
				return state.filter((_, itemIdx) => itemIdx !== idx);
			});
		},
		[confirmDelete, entries],
	);

	const exportDictionary = useCallback(() => {
		const fields: (keyof ITranslation)[] = [
			'from',
			'to',
			'originalText',
			'translatedText',
		];
		const rows = (entries || []).map((entry) => {
			const translation = entry.data.translation;
			return fields.map((key) => translation[key]);
		});

		const csv = Papa.unparse([fields, ...rows]);

		const date = new Date().toLocaleDateString();
		saveFile(
			new Blob([csv], { type: 'text/csv' }),
			`linguist_dictionary-${date}.csv`,
		);
	}, [entries]);

	const removeAll = useCallback(() => {
		if (!confirm(getMessage('dictionary_deleteAll'))) return;

		clearTranslations()
			.then(() => {
				setEntries(null);
				updateData();
				addMessage(getMessage('dictionary_message_deleteAll_success'), 'info');
			})
			.catch(() => {
				addMessage(getMessage('message_unknownError'), 'error');
			});
	}, [addMessage, updateData]);

	//
	// TTS
	//

	const { toggleTTS, ttsPlayer, ttsState } = useConcurrentTTS();

	// Stop TTS by change entries
	useEffect(() => {
		const currentPlayedTTS = ttsState.current ? ttsState.current.id : null;

		// Stop for empty entries or when current played entry removed
		if (
			entries === null ||
			(currentPlayedTTS && !entries.find(({ key }) => key === currentPlayedTTS))
		) {
			ttsPlayer.stop();
		}
	}, [entries, ttsPlayer, ttsState]);

	//
	// Render
	//

	const isMobile = useMemo(() => isMobileBrowser(), []);

	const [search, setSearch] = useState<string>('');
	const [from, setFrom] = useState<string | string[] | undefined>('any');
	const [to, setTo] = useState<string | string[] | undefined>('any');

	const resetFilters = useCallback(() => {
		setFrom('any');
		setTo('any');
		setSearch('');
	}, []);

	const renderedEntries = useMemo(() => {
		if (entries === null) return;

		// Empty content
		if (entries.length === 0)
			return (
				<div className={cnDictionaryPage('NotFoundMessage')}>
					<div className={cnDictionaryPage('NotFoundMessageContent')}>
						{getMessage('dictionary_emptyDictionary')}
					</div>
				</div>
			);

		// Filter entries if need
		// TODO: optimize it. Filtrate it on backend, debounce search input handling
		const fromIsEmpty = from === undefined || from === 'any';
		const toIsEmpty = to === undefined || to === 'any';
		const filtredEntries =
			fromIsEmpty && toIsEmpty && search.length === 0
				? entries
				: entries.filter((entry) => {
					const translation = entry.data.translation;

					if (!fromIsEmpty && translation.from !== from) return false;
					if (!toIsEmpty && translation.to !== to) return false;

					// Match text
					if (search.length !== 0) {
						const isTextsMatchSearch = isTextsContainsSubstring(
							search,
							[translation.originalText, translation.translatedText],
							true,
						);
						return isTextsMatchSearch;
					}

					return true;
				  });

		// Empty content
		if (filtredEntries.length === 0)
			return (
				<div className={cnDictionaryPage('NotFoundMessage')}>
					<div className={cnDictionaryPage('NotFoundMessageContent')}>
						{getMessage('dictionary_notFoundEntries') + ' '}
						<Button view="action" onPress={resetFilters}>
							{getMessage('dictionary_resetFilters')}
						</Button>
					</div>
				</div>
			);

		// Render entries
		return filtredEntries.map(({ data, key }, idx) => {
			const { timestamp, translation } = data;
			return (
				<TranslationCard
					key={key}
					translation={translation}
					timestamp={timestamp}
					onPressTTS={(target) => {
						if (target === 'original') {
							toggleTTS(key, translation.from, translation.originalText);
						} else {
							toggleTTS(key, translation.to, translation.translatedText);
						}
					}}
					controlPanelSlot={
						<Button
							view="clear"
							size="s"
							onPress={() => remove(idx)}
							title={getMessage('common_action_removeFromDictionary')}
							content="icon"
						>
							<Icon glyph="delete" scalable={false} />
						</Button>
					}
				/>
			);
		});
	}, [entries, from, to, search, resetFilters, remove, toggleTTS]);

	const langsListFrom = useMemo(
		() => [
			{ id: 'any', content: getMessage('lang_select') },
			{ id: 'auto', content: getMessage('lang_detect') },
			...langCodes.map((langCode) => ({
				id: langCode,
				content: getLanguageNameByCode(langCode),
			})),
		],
		[],
	);

	const langsListTo = useMemo(
		() => [
			{ id: 'any', content: getMessage('lang_select') },
			...langCodes.map((langCode) => ({
				id: langCode,
				content: getLanguageNameByCode(langCode),
			})),
		],
		[],
	);

	return (
		<Page loading={entries === null}>
			<div className={cnDictionaryPage({ mobile: isMobile })}>
				<LayoutFlow indent="2xl">
					<div className={cnDictionaryPage('Description')}>
						{getMessage('dictionary_description')}
					</div>

					<LayoutFlow indent="l" className={cnDictionaryPage('SearchPanel')}>
						<Textinput
							placeholder={getMessage('dictionary_searchPlaceholder')}
							value={search}
							onInputText={setSearch}
							className={cnDictionaryPage('SearchControl')}
							onClearClick={() => setSearch('')}
							hasClear
						/>

						<OptionsPanel
							className={cnDictionaryPage('SearchOptions')}
							view={isMobile ? 'mobile' : 'full'}
							options={[
								{
									title: getMessage('dictionary_filter_from'),
									content: (
										<Select
											options={langsListFrom}
											value={from}
											setValue={setFrom}
										/>
									),
								},
								{
									title: getMessage('dictionary_filter_to'),
									content: (
										<Select
											options={langsListTo}
											value={to}
											setValue={setTo}
										/>
									),
								},
							]}
						/>
					</LayoutFlow>

					<LayoutFlow indent="l" className={cnDictionaryPage('MainContainer')}>
						<LayoutFlow indent="m" direction="horizontal">
							{!isMobile && (
								<Button view="default" onPress={exportDictionary}>
									{getMessage('dictionary_button_export')}
								</Button>
							)}
							<Button view="default" onPress={removeAll}>
								{getMessage('dictionary_button_removeAll')}
							</Button>
						</LayoutFlow>

						<div className={cnDictionaryPage('Entries')}>
							{renderedEntries}
						</div>
					</LayoutFlow>
				</LayoutFlow>
			</div>

			<ToastMessages
				messages={messages}
				haltMessages={haltMessages}
				deleteMessage={deleteMessage}
			/>
		</Page>
	);
};
