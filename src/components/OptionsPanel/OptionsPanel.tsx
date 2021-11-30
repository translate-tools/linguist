import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

import './OptionsPanel.css';

export const cnOptionsPanel = cn('OptionsPanel');

export type Option = {
	title?: ReactNode;
	content?: ReactNode;
};

export interface IOptionsPanelProps {
	options: Option[];
	view: 'mobile' | 'full';
	className?: string;
}

/**
 * Component which render typical options lists
 */
export const OptionsPanel: FC<IOptionsPanelProps> = ({ options, view, className }) => {
	return (
		<div className={cnOptionsPanel({ view }, [className])}>
			{options.map((option, idx) => (
				<div className={cnOptionsPanel('Option')} key={idx}>
					{option.title && (
						<div className={cnOptionsPanel('OptionTitle')}>
							{option.title}
						</div>
					)}
					{option.content && (
						<div className={cnOptionsPanel('OptionBody')}>
							{option.content}
						</div>
					)}
				</div>
			))}
		</div>
	);
};
