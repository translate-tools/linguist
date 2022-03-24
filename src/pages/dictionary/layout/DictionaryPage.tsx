// TODO: adopt entries styles to mobile

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@bem-react/classname';
import Papa from 'papaparse';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { langCodes } from '@translate-tools/core/types/Translator';

import { getTranslations } from '../../../requests/backend/translations/getTranslations';
import { IEntryWithKey } from '../../../requests/backend/translations/data';
import { deleteTranslation } from '../../../requests/backend/translations/deleteTranslation';
import { clearTranslations } from '../../../requests/backend/translations/clearTranslations';

import { getLanguageNameByCode, getMessage } from '../../../lib/language';
import { saveFile } from '../../../lib/files';
import { useMessageBroker } from '../../../lib/hooks/useMessageBroker';
import { useTTS } from '../../../lib/hooks/useTTS';
import { isMobileBrowser } from '../../../lib/browser';

import { Button } from '../../../components/Button/Button.bundle/desktop';
import { Select } from '../../../components/Select/Select.bundle/desktop';
import { Textinput } from '../../../components/Textinput/Textinput.bundle/desktop';
import { Icon } from '../../../components/Icon/Icon.bundle/desktop';

import { OptionsPanel } from '../../../components/OptionsPanel/OptionsPanel';
import { LayoutFlow } from '../../../components/LayoutFlow/LayoutFlow';

import { Page } from '../../../layouts/Page/Page';
import { PageMessages } from '../../../layouts/Page/Messages/PageMessages';

import './DictionaryPage.css';

export const cnDictionaryPage = cn('DictionaryPage');

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
	const { messages, addMessage, deleteMessage, haltMessages } = useMessageBroker({
		hideDelay: 5000,
	});

	const [entries, setEntries] = useState<IEntryWithKey[] | null>(null);

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

			if (
				confirmDelete &&
				!confirm(
					getMessage('dictionary_deleteConfirmation') +
						'\n\n---\n\n' +
						entry.data.text +
						'\n\n---\n\n' +
						entry.data.translate,
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
		const csv = Papa.unparse([
			['from', 'to', 'text', 'translation'],
			...(entries || []).map(({ data: { from, to, text, translate } }) => [
				from,
				to,
				text,
				translate,
			]),
		]);

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

	const [TTSData, setTTSData] = useState<{
		id: string;
		lang: string;
		text: string;
	} | null>(null);

	const { lang: ttsLang = '', text: ttsText = '' } = TTSData || {};
	const ttsPlayer = useTTS(ttsLang, ttsText);

	const playPauseTTS = useImmutableCallback(
		(id: string, lang: string, text: string) => {
			const request = { id, lang, text };
			const isSameObject =
				TTSData !== null &&
				Object.keys(request).every(
					(key) => (request as any)[key] === (TTSData as any)[key],
				);

			if (isSameObject) {
				// if (ttsPlayer.isPlayed()) {
				if (ttsPlayer.isPlayed) {
					ttsPlayer.stop();
				} else {
					ttsPlayer.play();
				}
			} else {
				ttsPlayer.stop();
				setTTSData({ id, lang, text });
			}
		},
		[TTSData, ttsPlayer],
	);

	// Play by change TTSData
	useEffect(() => {
		if (TTSData !== null) {
			ttsPlayer.play();
		}
	}, [TTSData, ttsPlayer]);

	// Stop TTS by change entries list
	useEffect(() => {
		ttsPlayer.stop();
	}, [entries, ttsPlayer]);

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
					if (!fromIsEmpty && entry.data.from !== from) return false;
					if (!toIsEmpty && entry.data.to !== to) return false;

					// Match text
					if (search.length !== 0) {
						const searchPhrase = search.toLowerCase();

						if (entry.data.text.toLowerCase().search(searchPhrase) !== -1)
							return true;
						if (
							entry.data.translate
								.toLowerCase()
								.search(searchPhrase) !== -1
						)
							return true;

						return false;
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
		// TODO: highlight results
		return filtredEntries.map(({ data }, idx) => {
			const { text, translate, from, to, date } = data;
			return (
				<div key={idx} className={cnDictionaryPage('Entry')}>
					<div className={cnDictionaryPage('EntryHead')}>
						<div className={cnDictionaryPage('EntryMeta')}>
							<span className={cnDictionaryPage('Lang')}>
								{getLanguageNameByCode(from)}
							</span>
							<span className={cnDictionaryPage('Lang')}>
								{getLanguageNameByCode(to)}
							</span>
							{!isMobile && (
								<span className={cnDictionaryPage('Date')}>
									{new Date(date).toLocaleDateString()}
								</span>
							)}
						</div>
						<div className={cnDictionaryPage('EntryControl')}>
							<Button
								view="clear"
								size="s"
								onPress={() => remove(idx)}
								title={getMessage('common_action_removeFromDictionary')}
								content="icon"
							>
								<Icon glyph="delete" scalable={false} />
							</Button>
						</div>
					</div>
					<div className={cnDictionaryPage('EntryContent')}>
						<div className={cnDictionaryPage('EntryTextContainer')}>
							<div className={cnDictionaryPage('EntryTextAction')}>
								<Button
									onPress={() => {
										playPauseTTS(idx + '', from, text);
									}}
									view="clear"
									size="s"
								>
									<Icon glyph="volume-up" scalable={false} />
								</Button>
							</div>
							<div className={cnDictionaryPage('EntryText')}>{text}</div>
						</div>
						<div className={cnDictionaryPage('EntryTextContainer')}>
							<div className={cnDictionaryPage('EntryTextAction')}>
								<Button
									onPress={() => {
										playPauseTTS(idx + '', to, translate);
									}}
									view="clear"
									size="s"
								>
									<Icon glyph="volume-up" scalable={false} />
								</Button>
							</div>
							<div className={cnDictionaryPage('EntryText')}>
								{translate}
							</div>
						</div>
					</div>
				</div>
			);
		});
	}, [isMobile, entries, from, to, search, resetFilters, remove, playPauseTTS]);

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

					<LayoutFlow indent="m" className={cnDictionaryPage('SearchPanel')}>
						<Textinput
							placeholder={getMessage('dictionary_searchPlaceholder')}
							value={search}
							setValue={setSearch}
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

			<PageMessages
				messages={messages}
				haltMessages={haltMessages}
				deleteMessage={deleteMessage}
			/>
		</Page>
	);
};
