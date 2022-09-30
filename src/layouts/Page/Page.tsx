import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { Loader } from '../../components/Loader/Loader';

import './Page.css';

export const cnPage = cn('Page');

export interface IPageProps {
	loading?: boolean;
	renderWhileLoading?: boolean;
}

/**
 * Component for represent any standalone page
 */
export const Page: FC<IPageProps> = ({
	children,
	loading,
	renderWhileLoading = false,
}) => {
	return (
		<div className={cnPage()}>
			{loading && (
				<div className={cnPage('Placeholder')}>
					<Loader />
				</div>
			)}

			{!loading || renderWhileLoading ? (
				// TODO: add modifier to hide
				<div
					className={cnPage('Body')}
					style={{ display: loading ? 'none' : 'block' }}
				>
					{children}
				</div>
			) : null}
		</div>
	);
};
