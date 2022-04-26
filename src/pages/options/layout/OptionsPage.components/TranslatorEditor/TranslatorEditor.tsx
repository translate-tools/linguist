import React, { FC, useContext, useEffect, useState } from 'react';
import { cn } from '@bem-react/classname';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

import { Button } from '../../../../../components/Button/Button.bundle/universal';
import { Textinput } from '../../../../../components/Textinput/Textinput.bundle/desktop';
import { Textarea } from '../../../../../components/Textarea/Textarea.bundle/desktop';

import { LayoutFlow } from '../../../../../components/LayoutFlow/LayoutFlow';
import { ModalLayout } from '../../../../../components/ModalLayout/ModalLayout';
import { IModalProps, Modal } from '../../../../../components/Modal/Modal.bundle/desktop';

import { OptionsModalsContext } from '../../OptionsPage';
import { CustomTranslator } from '../TranslatorsManager/TranslatorsManager';

import './TranslatorEditor.css';

const cnTranslatorsEditor = cn('TranslatorEditor');

export type EditedCustomTranslator = Pick<
	CustomTranslator,
	Exclude<keyof CustomTranslator, 'id'>
> &
	Partial<Pick<CustomTranslator, 'id'>>;

interface TranslatorEditorProps extends Pick<IModalProps, 'onClose'> {
	translator: CustomTranslator | null;
	onSave: (value: EditedCustomTranslator) => void;
	error: null | string;
}

export const TranslatorEditor: FC<TranslatorEditorProps> = ({
	translator,
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
		if (translator === null) return;
		setName(translator.name);
		setCode(translator.code);
	}, [translator]);

	const onSavePress = useImmutableCallback(() => {
		const { id } = translator || {};

		if (name.trim().length < 1) {
			setLocalError('Name must contain at least 1 symbol');
			return;
		}

		onSave({
			id,
			name,
			code,
		});
	}, [code, name, onSave, translator]);

	const actualError = localError || error;

	return (
		<Modal visible={true} onClose={onClose} scope={scope} preventBodyScroll>
			<div className={cnTranslatorsEditor({})}>
				<ModalLayout
					footer={[
						<Button view="action" onPress={onSavePress}>
							Save
						</Button>,
						<Button onPress={onClose as any}>Close</Button>,
					]}
				>
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
