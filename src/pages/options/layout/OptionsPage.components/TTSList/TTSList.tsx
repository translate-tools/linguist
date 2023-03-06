import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';

import { CustomTTS } from '../../../../../app/Background/TTSManager';

import { Button } from '../../../../../components/primitives/Button/Button.bundle/universal';
import { Icon } from '../../../../../components/primitives/Icon/Icon.bundle/desktop';
import { LayoutFlow } from '../../../../../components/layouts/LayoutFlow/LayoutFlow';
import { Loader } from '../../../../../components/primitives/Loader/Loader';
import { Modal } from '../../../../../components/primitives/Modal/Modal.bundle/desktop';
import { ModalLayout } from '../../../../../components/layouts/ModalLayout/ModalLayout';

import { getCustomSpeakers } from '../../../../../requests/backend/tts/getCustomSpeakers';
import { deleteCustomSpeaker } from '../../../../../requests/backend/tts/deleteCustomSpeaker';
import { addCustomSpeaker } from '../../../../../requests/backend/tts/addCustomSpeaker';
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

	const [emptyData] = useState<EditorEntry>({
		name: '',
		code: '',
	});

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
			if (!confirm(`Are you sure about delete speaker "${speaker.name}"`)) return;

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
						title={'Text to speech modules'}
						footer={[
							<Button key="add" view="action" onPress={addNewSpeaker}>
								Add
							</Button>,
							<Button key="close" onPress={onClose}>
								Close
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
												Edit
											</Button>
											<Button
												onPress={() => {
													deleteSpeakerWithConfirmation(
														speaker,
													);
												}}
												title={'Delete'}
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
							: "List are empty. Let's add new module"}
					</ModalLayout>
				</div>
			)}

			{isEditorOpened && (
				<Editor
					data={speakerToEdit || emptyData}
					onClose={closeEditor}
					onSave={onSave}
					error={editorError}
				/>
			)}
		</Modal>
	);
};
