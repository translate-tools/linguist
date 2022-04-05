import { cn } from '@bem-react/classname';
import React, { FC, useContext, useState } from 'react';

// TODO: move modal to local component
import { Modal } from 'react-elegant-ui/components/Modal/Modal.bundle/desktop';
import { Button } from '../../../../../components/Button/Button.bundle/universal';
import { LayoutFlow } from '../../../../../components/LayoutFlow/LayoutFlow';
import { ModalLayout } from '../../../../../components/ModalLayout/ModalLayout';
import { OptionsModalsContext } from '../../OptionsPage';
import { TranslatorEditor } from '../TranslatorEditor/TranslatorEditor';

import './TranslatorsManager.css';

export type CustomTranslator = {
	id: string;
	name: string;
	code: string;
};

const cnTranslatorsManager = cn('TranslatorsManager');

export const TranslatorsManager: FC<{
	visible: boolean;
	onClose: () => void;
}> = ({ visible, onClose }) => {
	const scope = useContext(OptionsModalsContext);

	const [editedTranslator, setEditedTranslator] = useState<CustomTranslator | null>(
		null,
	);

	const translators: CustomTranslator[] = Array(15)
		.fill(1)
		.map((_, idx) => {
			const id = idx + 1;
			return {
				id: '' + id,
				name: 'TestTranslator #' + id,
				code: 'some code of translator #' + id,
			};
		});

	return (
		<Modal visible={visible} onClose={onClose} scope={scope} preventBodyScroll>
			<ModalLayout
				title={'Custom translators list'}
				footer={[
					<Button
						view="action"
						onPress={() => {
							setEditedTranslator({
								id: '',
								name: '',
								code: '',
							});
						}}
					>
						Add new
					</Button>,
					<Button onPress={onClose}>Close</Button>,
				]}
			>
				<div className={cnTranslatorsManager({})}>
					<LayoutFlow direction="vertical" indent="m">
						{translators.map((translatorInfo) => {
							const { id, name } = translatorInfo;

							return (
								<div
									className={cnTranslatorsManager('TranslatorEntry')}
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
												setEditedTranslator(translatorInfo);
											}}
										>
											Edit
										</Button>
										<Button>Delete</Button>
									</LayoutFlow>
								</div>
							);
						})}
					</LayoutFlow>
				</div>
			</ModalLayout>

			{editedTranslator === null ? undefined : (
				<TranslatorEditor
					translator={editedTranslator}
					onClose={() => setEditedTranslator(null)}
					onSave={(translator) => {
						console.warn('Updated Translator', translator);
						setEditedTranslator(null);
					}}
				/>
			)}
		</Modal>
	);
};
