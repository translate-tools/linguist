import React, { FC, useContext, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { Button } from '../../../../../components/primitives/Button/Button.bundle/universal';
import { Textinput } from '../../../../../components/primitives/Textinput/Textinput.bundle/desktop';
import { Textarea } from '../../../../../components/primitives/Textarea/Textarea.bundle/desktop';

import { LayoutFlow } from '../../../../../components/layouts/LayoutFlow/LayoutFlow';
import { ModalLayout } from '../../../../../components/layouts/ModalLayout/ModalLayout';
import {
	IModalProps,
	Modal,
} from '../../../../../components/primitives/Modal/Modal.bundle/desktop';

import { getMessage } from '../../../../../lib/language';
import { OptionsModalsContext } from '../../OptionsPage';

import './TranslatorEditor.css';

const cnTranslatorsEditor = cn('TranslatorEditor');

// TODO: review a file

// TODO: rename all entities
export type EditedCustomTranslator = {
	name: string;
	code: string;
};

interface TranslatorEditorProps extends Pick<IModalProps, 'onClose'> {
	data: EditedCustomTranslator;
	onSave: (value: EditedCustomTranslator) => void;
	error: null | string;
}

export const TranslatorEditor: FC<TranslatorEditorProps> = ({
	data,
	onClose,
	onSave,
	error,
}) => {
	const scope = useContext(OptionsModalsContext);

	const [name, setName] = useState('');
	const [code, setCode] = useState('');

	// Local error are reset while update outer error
	const [localError, setLocalError] = useState<string | null>(null);
	useEffect(() => {
		setLocalError(null);
	}, [error]);

	// Init
	useEffect(() => {
		if (data === null) return;
		setName(data.name);
		setCode(data.code);
	}, [data]);

	const onSavePress = useImmutableCallback(() => {
		if (name.trim().length < 1) {
			setLocalError(
				getMessage('translatorEditorWindow_message_invalidTranslatorName'),
			);
			return;
		}

		onSave({
			name,
			code,
		});
	}, [code, name, onSave]);

	const actualError = localError || error;

	return (
		<Modal visible={true} onClose={onClose} scope={scope} preventBodyScroll>
			<div className={cnTranslatorsEditor({})}>
				<ModalLayout
					footer={[
						<Button key="save" view="action" onPress={onSavePress}>
							{getMessage('translatorEditorWindow_save')}
						</Button>,
						<Button key="close" onPress={onClose as any}>
							{getMessage('translatorEditorWindow_close')}
						</Button>,
					]}
				>
					<LayoutFlow direction="vertical" indent="l">
						<LayoutFlow direction="vertical" indent="m">
							<div>
								{getMessage('translatorEditorWindow_translatorName')}
							</div>
							<Textinput
								value={name}
								onChange={(evt) => {
									setName(evt.target.value);
								}}
							/>
						</LayoutFlow>

						<LayoutFlow direction="vertical" indent="m">
							<div>
								{getMessage('translatorEditorWindow_translatorCode')}
							</div>
							<Textarea
								value={code}
								onChange={(evt) => {
									setCode(evt.target.value);
								}}
							/>
						</LayoutFlow>

						{actualError && (
							<div className={cnTranslatorsEditor('Error')}>
								{actualError}
							</div>
						)}
					</LayoutFlow>
				</ModalLayout>
			</div>
		</Modal>
	);
};
