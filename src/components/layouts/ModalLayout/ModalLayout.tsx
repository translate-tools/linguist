import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

import { LayoutFlow } from '../LayoutFlow/LayoutFlow';

import './ModalLayout.css';

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

				{footer && (
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
