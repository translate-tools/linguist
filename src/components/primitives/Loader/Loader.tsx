import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import SpinnerSVGElement from './Loader.assets/fidget_spinner.svg';

import './Loader.css';

export const cnLoader = cn('Loader');

// TODO: use library spinner
export const Loader: FC<{ className?: string }> = ({ className }) => {
	return (
		<div className={cnLoader('', {}, [className])}>
			<SpinnerSVGElement className={cnLoader('Image')} viewBox="0 0 54 54" />
		</div>
	);
};
