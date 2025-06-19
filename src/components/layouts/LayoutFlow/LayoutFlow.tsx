import React, { FC, ReactNode, useMemo } from 'react';
import { cn } from '@bem-react/classname';

import './LayoutFlow.css';

export const cnLayoutFlow = cn('LayoutFlow');
export interface ILayoutFlowProps {
	direction?: 'horizontal' | 'vertical';
	indent?: 's' | 'm' | 'l' | 'xl' | '2xl';
	className?: string;
	children?: ReactNode | ReactNode[];
}
/** * Layout component to arrange children components by some direction with optional indentation */
export const LayoutFlow: FC<ILayoutFlowProps> = ({
	direction = 'vertical',
	indent,
	className,
	children,
}) => {
	const content = useMemo(() => {
		const childs = Array.isArray(children) ? children : [children];
		return childs.filter(Boolean).map((content, idx) => (
			<div className={cnLayoutFlow('Item')} key={idx}>
				{' '}
				{content}{' '}
			</div>
		));
	}, [children]);
	return (
		<div className={cnLayoutFlow({ direction, indent }, [className])}>{content}</div>
	);
};
