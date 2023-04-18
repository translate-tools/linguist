import React, { FC, ReactEventHandler, ReactNode, useCallback } from 'react';

export interface ISpoilerProps {
	title: ReactNode;

	onToggle?: (state: boolean) => void;
	open?: boolean;
}

// TODO: add styles
// TODO: add modifiers and make bundle
export const Spoiler: FC<ISpoilerProps> = ({ title, children, open, onToggle }) => {
	const onToggleSpoiler: ReactEventHandler<HTMLDetailsElement> = useCallback(
		(evt) => {
			if (onToggle !== undefined) {
				const isOpen = Boolean((evt.target as HTMLDetailsElement).open);
				onToggle(isOpen);
			}
		},
		[onToggle],
	);

	return (
		<details open={open} onToggle={onToggleSpoiler}>
			<summary>{title}</summary>
			<div>{children}</div>
		</details>
	);
};
