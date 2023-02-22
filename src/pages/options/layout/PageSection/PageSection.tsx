import React, { FC } from 'react';
import { cnOptionsPage } from '../OptionsPage';

import './PageSection.css';

export interface PageSection {
	title?: string;
	level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const PageSection: FC<PageSection> = ({ title, level = 2, children }) => {
	const HeadElement = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[level - 1];
	return (
		<div className={cnOptionsPage('PageSection')}>
			{title !== undefined ? (
				<HeadElement className={cnOptionsPage('PageSectionTitle')}>
					{title}
				</HeadElement>
			) : undefined}
			<div
				className={cnOptionsPage('Container', {}, [
					cnOptionsPage('IndentMixin', { vertical: true }),
				])}
			>
				{children}
			</div>
		</div>
	);
};
