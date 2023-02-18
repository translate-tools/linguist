import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';

import { Button } from '../../../../../components/Button/Button.bundle/universal';
import { Icon } from '../../../../../components/Icon/Icon.bundle/desktop';
import { LayoutFlow } from '../../../../../components/LayoutFlow/LayoutFlow';
import { Loader } from '../../../../../components/Loader/Loader';
import { Modal } from '../../../../../components/Modal/Modal.bundle/desktop';
import { ModalLayout } from '../../../../../components/ModalLayout/ModalLayout';

import { getMessage } from '../../../../../lib/language';

import { CustomTranslator } from '../../../../../requests/backend/translators';
import { addTranslator } from '../../../../../requests/backend/translators/addTranslator';
import { deleteTranslator } from '../../../../../requests/backend/translators/deleteTranslator';
import { getTranslators } from '../../../../../requests/backend/translators/getTranslators';
import { updateTranslator } from '../../../../../requests/backend/translators/updateTranslator';

import { OptionsModalsContext } from '../../OptionsPage';
import {
	EditedCustomTranslator,
	TranslatorEditor,
} from '../TranslatorEditor/TranslatorEditor';

import './TranslatorsManager.css';

const cnTranslatorsManager = cn('TranslatorsManager');

export const TranslatorsManager: FC<{
	visible: boolean;
	onClose: () => void;
	updateConfig: () => void;
}> = ({ visible, onClose, updateConfig }) => {
	const scope = useContext(OptionsModalsContext);

	const [editorError, setEditorError] = useState<string | null>(null);
	const [isEditorOpened, setIsEditorOpened] = useState(false);
	const [editedTranslator, setEditedTranslator] = useState<CustomTranslator | null>(
		null,
	);

	const [isLoading, setIsLoading] = useState(true);
	const [translators, setTranslators] = useState<CustomTranslator[]>([]);

	const addNewTranslator = useCallback(() => {
		setEditedTranslator(null);
		setIsEditorOpened(true);
	}, []);

	const updateTranslatorsList = useCallback(async () => {
		updateConfig();

		await getTranslators().then(setTranslators);
	}, [updateConfig]);

	const editTranslator = useCallback((translator: CustomTranslator) => {
		setEditedTranslator(translator);
		setIsEditorOpened(true);
	}, []);

	const closeEditor = useCallback(() => {
		setEditorError(null);
		setEditedTranslator(null);
		setIsEditorOpened(false);
	}, []);

	const deleteTranslatorWithConfirmation = useCallback(
		(translator: CustomTranslator) => {
			if (
				!confirm(
					getMessage(
						'translatorsManagerWindow_message_translatorRemovingConfirmation',
						[translator.name],
					),
				)
			)
				return;

			deleteTranslator(translator.id).then(() => {
				updateTranslatorsList();
			});
		},
		[updateTranslatorsList],
	);

	const onSave = useCallback(
		async (translator: EditedCustomTranslator) => {
			const { id, name, code } = translator;

			setEditorError(null);
			try {
				if (id === undefined) {
					await addTranslator({ name, code });
				} else {
					await updateTranslator({ id, translator: { name, code } });
				}
			} catch (error) {
				if (error instanceof Error) {
					setEditorError(error.message);
				}

				return;
			}

			await updateTranslatorsList();
			closeEditor();
		},
		[closeEditor, updateTranslatorsList],
	);

	useEffect(() => {
		updateTranslatorsList().then(() => {
			setIsLoading(false);
		});
	}, [updateTranslatorsList]);

	return (
		<Modal visible={visible} onClose={onClose} scope={scope} preventBodyScroll>
			{isLoading ? (
				<Loader />
			) : (
				<div className={cnTranslatorsManager({})}>
					<ModalLayout
						title={getMessage('translatorsManagerWindow_title')}
						footer={[
							<Button key="add" view="action" onPress={addNewTranslator}>
								{getMessage('translatorsManagerWindow_add')}
							</Button>,
							<Button key="close" onPress={onClose}>
								{getMessage('translatorsManagerWindow_close')}
							</Button>,
						]}
					>
						<div className={cnTranslatorsManager('Description')}>
							{getMessage('translatorsManagerWindow_description') + ' '}
							<a
								href="https://github.com/translate-tools/linguist/blob/master/docs/CustomTranslator.md"
								target="_blank"
							>
								{getMessage('translatorsManagerWindow_description_link')}
							</a>
						</div>

						<LayoutFlow direction="vertical" indent="m">
							{translators.map((translatorInfo) => {
								const { id, name } = translatorInfo;

								return (
									<div
										className={cnTranslatorsManager(
											'TranslatorEntry',
										)}
										key={id}
									>
										<span
											className={cnTranslatorsManager(
												'TranslatorEntryName',
											)}
										>
											{name}
										</span>

										<LayoutFlow
											direction="horizontal"
											indent="m"
											className={cnTranslatorsManager(
												'TranslatorEntryControls',
											)}
										>
											<Button
												onPress={() => {
													editTranslator(translatorInfo);
												}}
											>
												{getMessage(
													'translatorsManagerWindow_translator_edit',
												)}
											</Button>
											<Button
												onPress={() => {
													deleteTranslatorWithConfirmation(
														translatorInfo,
													);
												}}
												title={getMessage(
													'translatorsManagerWindow_translator_delete',
												)}
											>
												<Icon glyph="delete" scalable={false} />
											</Button>
										</LayoutFlow>
									</div>
								);
							})}
						</LayoutFlow>

						{translators.length !== 0
							? undefined
							: getMessage(
								'translatorsManagerWindow_emptyTranslatorsListText',
							  )}
					</ModalLayout>
				</div>
			)}

			{isEditorOpened && (
				<TranslatorEditor
					translator={editedTranslator}
					onClose={closeEditor}
					onSave={onSave}
					error={editorError}
				/>
			)}
		</Modal>
	);
};
