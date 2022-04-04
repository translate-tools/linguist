import { cn } from '@bem-react/classname';
import React, { FC } from 'react';

// TODO: move modal to local component
import { Modal } from 'react-elegant-ui/components/Modal/Modal.bundle/desktop';
import { Button } from '../../../../../components/Button/Button.bundle/universal';

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

	// TODO: make default layouts. Title bar, buttons bar
	return (
		<Modal visible={visible} onClose={onClose} scope={scope} preventBodyScroll>
			<div style={{ padding: '1rem' }}>
				<div className={cnTranslatorsManager({})}>
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

								<Button>Edit</Button>
								<Button>Delete</Button>
							</div>
						);
					})}
				</div>
				<div style={{ padding: '1rem' }}>
					<Button onPress={onClose}>Close</Button>
				</div>
			</div>
		</Modal>
	);
};
