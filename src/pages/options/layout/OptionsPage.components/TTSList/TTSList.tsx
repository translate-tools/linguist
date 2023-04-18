import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';

import { CustomTTS } from '../../../../../app/Background/TTS/TTSManager';
import { LayoutFlow } from '../../../../../components/layouts/LayoutFlow/LayoutFlow';
import { ModalLayout } from '../../../../../components/layouts/ModalLayout/ModalLayout';
import { Button } from '../../../../../components/primitives/Button/Button.bundle/universal';
import { Icon } from '../../../../../components/primitives/Icon/Icon.bundle/desktop';
import { Loader } from '../../../../../components/primitives/Loader/Loader';
import { Modal } from '../../../../../components/primitives/Modal/Modal.bundle/desktop';
import { getMessage } from '../../../../../lib/language';
import { addCustomSpeaker } from '../../../../../requests/backend/tts/addCustomSpeaker';
import { deleteCustomSpeaker } from '../../../../../requests/backend/tts/deleteCustomSpeaker';
import { getCustomSpeakers } from '../../../../../requests/backend/tts/getCustomSpeakers';
import { updateCustomSpeaker } from '../../../../../requests/backend/tts/updateCustomSpeaker';
import { OptionsModalsContext } from '../../OptionsPage';

import { Editor, EditorEntry } from '../Editor/Editor';

import './TTSList.css';

const cnTTSList = cn('TTSList');

export const TTSList: FC<{
	visible: boolean;
	onClose: () => void;
	updateConfig: () => void;
}> = ({ visible, onClose, updateConfig }) => {
	const scope = useContext(OptionsModalsContext);

	// Initializing
	const [isLoading, setIsLoading] = useState(true);
	const [customSpeakers, setCustomSpeakers] = useState<CustomTTS[]>([]);

	const updateSpeakersList = useCallback(async () => {
		updateConfig();

		await getCustomSpeakers().then(setCustomSpeakers);
	}, [updateConfig]);

	useEffect(() => {
		updateSpeakersList().then(() => {
			setIsLoading(false);
		});
	}, [updateSpeakersList]);

	// Editor
	const [editorError, setEditorError] = useState<string | null>(null);
	const [isEditorOpened, setIsEditorOpened] = useState(false);

	const [speakerToEdit, setSpeakerToEdit] = useState<CustomTTS | null>(null);

	const addNewSpeaker = useCallback(() => {
		setSpeakerToEdit(null);
		setIsEditorOpened(true);
	}, []);

	const editSpeaker = useCallback((speaker: CustomTTS) => {
		setSpeakerToEdit(speaker);
		setIsEditorOpened(true);
	}, []);

	const closeEditor = useCallback(() => {
		setEditorError(null);
		setSpeakerToEdit(null);
		setIsEditorOpened(false);
	}, []);

	const deleteSpeakerWithConfirmation = useCallback(
		(speaker: CustomTTS) => {
			const isConfirmed = confirm(
				getMessage('ttsManagerWindow_message_ttsRemoveConfirmation', [
					speaker.name,
				]),
			);

			if (!isConfirmed) return;

			deleteCustomSpeaker(speaker.id).then(() => {
				updateSpeakersList();
			});
		},
		[updateSpeakersList],
	);

	const onSave = useCallback(
		async (speaker: EditorEntry) => {
			const { name, code } = speaker;

			setEditorError(null);
			try {
				if (speakerToEdit === null) {
					await addCustomSpeaker({ name, code });
				} else {
					await updateCustomSpeaker({ id: speakerToEdit.id, name, code });
				}
			} catch (error) {
				if (error instanceof Error) {
					setEditorError(error.message);
				}

				return;
			}

			await updateSpeakersList();
			closeEditor();
		},
		[closeEditor, speakerToEdit, updateSpeakersList],
	);

	return (
		<Modal visible={visible} onClose={onClose} scope={scope} preventBodyScroll>
			{isLoading ? (
				<Loader />
			) : (
				<div className={cnTTSList({})}>
					<ModalLayout
						title={getMessage('ttsManagerWindow_title')}
						footer={[
							<Button key="add" view="action" onPress={addNewSpeaker}>
								{getMessage('ttsManagerWindow_add')}
							</Button>,
							<Button key="close" onPress={onClose}>
								{getMessage('ttsManagerWindow_close')}
							</Button>,
						]}
					>
						<LayoutFlow direction="vertical" indent="m">
							{customSpeakers.map((speaker) => {
								const { id, name } = speaker;

								return (
									<div className={cnTTSList('Entry')} key={id}>
										<span className={cnTTSList('EntryName')}>
											{name}
										</span>

										<LayoutFlow
											direction="horizontal"
											indent="m"
											className={cnTTSList('EntryControls')}
										>
											<Button
												onPress={() => {
													editSpeaker(speaker);
												}}
											>
												{getMessage(
													'ttsManagerWindow_translator_edit',
												)}
											</Button>
											<Button
												onPress={() => {
													deleteSpeakerWithConfirmation(
														speaker,
													);
												}}
												title={
													'ttsManagerWindow_translator_delete'
												}
											>
												<Icon glyph="delete" scalable={false} />
											</Button>
										</LayoutFlow>
									</div>
								);
							})}
						</LayoutFlow>

						{customSpeakers.length !== 0
							? undefined
							: getMessage('ttsManagerWindow_emptyTranslatorsListText')}
					</ModalLayout>
				</div>
			)}

			{isEditorOpened && (
				<Editor
					data={speakerToEdit}
					onClose={closeEditor}
					onSave={onSave}
					error={editorError}
				/>
			)}
		</Modal>
	);
};
