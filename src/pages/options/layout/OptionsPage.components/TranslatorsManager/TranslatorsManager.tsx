import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';

import { Button } from '../../../../../components/Button/Button.bundle/universal';
import { Icon } from '../../../../../components/Icon/Icon.bundle/desktop';
import { LayoutFlow } from '../../../../../components/LayoutFlow/LayoutFlow';
import { Loader } from '../../../../../components/Loader/Loader';
import { Modal } from '../../../../../components/Modal/Modal.bundle/desktop';
import { ModalLayout } from '../../../../../components/ModalLayout/ModalLayout';

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

export type CustomTranslator = {
	id: number;
	name: string;
	code: string;
};

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

		await getTranslators().then((translators) => {
			setTranslators(translators.map(({ key: id, data }) => ({ id, ...data })));
		});
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
			if (!confirm(`Are you sure about removing translator "${translator.name}"?`))
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

			// await new Promise((res) => setTimeout(res, 1000));
			setEditorError(null);
			try {
				if (id === undefined) {
					await addTranslator({ name, code });
				} else {
					const data = { id, translator: { name, code } };
					await updateTranslator(data);
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
						title={'Custom translators list'}
						footer={[
							<Button view="action" onPress={addNewTranslator}>
								Add new
							</Button>,
							<Button onPress={onClose}>Close</Button>,
						]}
					>
						{translators.length !== 0
							? undefined
							: 'Custom translate modules is not defined yet'}
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
												Edit
											</Button>
											<Button
												onPress={() => {
													deleteTranslatorWithConfirmation(
														translatorInfo,
													);
												}}
											>
												<Icon glyph="delete" scalable={false} />
											</Button>
										</LayoutFlow>
									</div>
								);
							})}
						</LayoutFlow>
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
