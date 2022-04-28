import React, { ReactNode, FC } from 'react';
import { cn } from '@bem-react/classname';

import './ModalLayout.css';
import { LayoutFlow } from '../LayoutFlow/LayoutFlow';

export const cnModalLayout = cn('ModalLayout');

export const ModalLayout: FC<{
	title?: string | ReactNode;
	footer?: ReactNode | ReactNode[];
}> = ({ title, footer, children }) => {
	return (
		<div className={cnModalLayout({})}>
			<LayoutFlow direction="vertical" indent="2xl">
				{typeof title === 'string' ? (
					<span className={cnModalLayout('Title')}>{title}</span>
				) : (
					title
				)}

				{children}

				{footer === undefined ? undefined : (
					<div className={cnModalLayout('Footer')}>
						<LayoutFlow direction="horizontal" indent="m">
							{footer}
						</LayoutFlow>
					</div>
				)}
			</LayoutFlow>
		</div>
	);
};
