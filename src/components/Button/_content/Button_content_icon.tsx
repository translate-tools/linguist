import React from 'react';
import { withHOCConstructor } from 'react-elegant-ui/esm/lib/compose';
import { useComponentRegistry } from 'react-elegant-ui/esm/lib/di';

import { IButtonProps, cnButton } from 'react-elegant-ui/esm/components/Button/Button';
import { IButtonDesktopRegistry } from 'react-elegant-ui/esm/components/Button/Button.registry/desktop';

import './Button_content_icon.css';

export interface ButtonContentIcon {
	content?: 'icon';
}

/**
 * Modifier for square buttons with icon
 */
export const withModButtonContentIcon = withHOCConstructor<
	ButtonContentIcon,
	IButtonProps
>({ matchProps: { content: 'icon' } }, (Button) => ({ content, children, ...props }) => {
	const { Content } = useComponentRegistry<IButtonDesktopRegistry>(cnButton());

	return (
		<Button {...props} className={cnButton({ content }, [props.className])} raw>
			<Content raw>{children}</Content>
		</Button>
	);
});
