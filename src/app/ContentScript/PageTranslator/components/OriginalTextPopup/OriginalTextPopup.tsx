import React, { FC, RefObject } from 'react';
import { cn } from '@bem-react/classname';

import { Popup } from '../../../../../components/primitives/Popup/Popup';

import './OriginalTextPopup.css';

export const cnOriginalTextPopup = cn('OriginalTextPopup');

export interface IOriginalTextPopupProps {
	target: RefObject<HTMLElement>;
}

export const OriginalTextPopup: FC<IOriginalTextPopupProps> = ({ target, children }) => {
	return (
		<Popup
			target="anchor"
			anchor={target}
			view="default"
			visible={true}
			zIndex={999999999}
		>
			<div className={cnOriginalTextPopup()}>{children}</div>
		</Popup>
	);
};
