import React, { FC, ReactNode } from 'react';

import { cnOptionsPage } from '../OptionsPage';

import './OptionSection.css';

export interface OptionSection {
	title?: string;
	description?: ReactNode;
	changed?: boolean;
	error?: string;
}
export const OptionSection: FC<OptionSection> = ({
	title,
	description,
	changed,
	children,
	error,
}) => (
	<div
		className={cnOptionsPage('Container', {}, [
			cnOptionsPage('IndentMixin', { vertical: true }),
		])}
	>
		<div className={cnOptionsPage('OptionSection', { changed })}>
			<div className={cnOptionsPage('OptionTitle')}>{title}</div>
			<div className={cnOptionsPage('OptionContainer')}>
				{children}
				{error !== undefined ? (
					<div className={cnOptionsPage('OptionErrorMessage')}>{error}</div>
				) : undefined}
				{description !== undefined ? (
					<div className={cnOptionsPage('OptionDescription')}>
						{' '}
						{description}{' '}
					</div>
				) : undefined}
			</div>
		</div>
	</div>
);
