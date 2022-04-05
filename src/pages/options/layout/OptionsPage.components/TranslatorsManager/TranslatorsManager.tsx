import { cn } from '@bem-react/classname';
import React, { FC } from 'react';

// TODO: move modal to local component
import { Modal } from 'react-elegant-ui/components/Modal/Modal.bundle/desktop';
import { Button } from '../../../../../components/Button/Button.bundle/universal';
import { LayoutFlow } from '../../../../../components/LayoutFlow/LayoutFlow';
import { ModalLayout } from '../../../../../components/ModalLayout/ModalLayout';

import './TranslatorsManager.css';

type CustomTranslator = {
	id: string;
	name: string;
	code: string;
};

const cnTranslatorsManager = cn('TranslatorsManager');

export const TranslatorsManager: FC<{
	visible: boolean;
	onClose: () => void;
	scope: React.RefObject<HTMLDivElement>;
}> = ({ visible, onClose, scope }) => {
	const translators: CustomTranslator[] = [
		{
			id: '1',
			name: 'TestTranslator #1',
			code: '123',
		},
		{
			id: '2',
			name: 'TestTranslator #2',
			code: '123',
		},
	];

	return (
		<Modal visible={visible} onClose={onClose} scope={scope} preventBodyScroll>
			<ModalLayout
				title={'Custom translators list'}
				footer={<Button onPress={onClose}>Close</Button>}
			>
				<div className={cnTranslatorsManager({})}>
					<LayoutFlow direction="vertical" indent="m">
						{translators.map(({ id, name }) => {
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
										<Button>Edit</Button>
										<Button>Delete</Button>
									</LayoutFlow>
								</div>
							);
						})}
					</LayoutFlow>
				</div>
			</ModalLayout>
		</Modal>
	);
};
