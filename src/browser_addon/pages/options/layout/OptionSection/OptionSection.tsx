import React from 'react';
import { FC } from 'react';
import { cnOptionsPage } from '../OptionsPage';

import './OptionSection.css';

export interface OptionSection {
	title?: string;
	description?: string;
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
			{title !== undefined ? (
				<div className={cnOptionsPage('OptionTitle')}>{title}</div>
			) : undefined}
			<div className={cnOptionsPage('OptionContainer')}>{children}</div>
			{error !== undefined ? (
				<div className={cnOptionsPage('OptionErrorMessage')}>{error}</div>
			) : undefined}
			{description !== undefined ? (
				<div className={cnOptionsPage('OptionDescription')}>{description}</div>
			) : undefined}
		</div>
	</div>
);
