import React, { FC, useContext, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import {
	Modal,
	IModalProps,
} from 'react-elegant-ui/components/Modal/Modal.bundle/desktop';
import { Button } from '../../../../../components/Button/Button.bundle/universal';
import { LayoutFlow } from '../../../../../components/LayoutFlow/LayoutFlow';
import { ModalLayout } from '../../../../../components/ModalLayout/ModalLayout';

import { Textinput } from '../../../../../components/Textinput/Textinput.bundle/desktop';
import { Textarea } from '../../../../../components/Textarea/Textarea.bundle/desktop';

import { OptionsModalsContext } from '../../OptionsPage';

import './TranslatorEditor.css';
import { CustomTranslator } from '../TranslatorsManager/TranslatorsManager';

const cnTranslatorsEditor = cn('TranslatorEditor');

interface TranslatorEditorProps extends Pick<IModalProps, 'onClose'> {
	translator: CustomTranslator;
	onSave: (value: CustomTranslator) => void;
}

export const TranslatorEditor: FC<TranslatorEditorProps> = ({
	translator,
	onClose,
	onSave,
}) => {
	const scope = useContext(OptionsModalsContext);

	const [name, setName] = useState('');
	const [code, setCode] = useState('');

	// Init
	useEffect(() => {
		setName(translator.name);
		setCode(translator.code);
	}, [translator.code, translator.name]);

	const onSavePress = useImmutableCallback(() => {
		onSave({
			id: translator.id,
			name,
			code,
		});
	}, [code, name, onSave, translator.id]);

	return (
		<Modal visible={true} onClose={onClose} scope={scope} preventBodyScroll>
			<ModalLayout
				footer={[
					<Button view="action" onPress={onSavePress}>
						Save
					</Button>,
					<Button onPress={onClose as any}>Close</Button>,
				]}
			>
				<div className={cnTranslatorsEditor({})}>
					<LayoutFlow direction="vertical" indent="l">
						<LayoutFlow direction="vertical" indent="m">
							<div>Name</div>
							<Textinput value={name} setValue={setName} />
						</LayoutFlow>

						<LayoutFlow direction="vertical" indent="m">
							<div>Code</div>
							<Textarea
								value={code}
								onChange={(evt) => {
									setCode(evt.target.value);
								}}
							/>
						</LayoutFlow>
					</LayoutFlow>
				</div>
			</ModalLayout>
		</Modal>
	);
};
