import { useComponentRegistry } from 'react-elegant-ui/esm/lib/di';
import { usePress } from '@react-aria/interactions';
import { mergeProps } from '@react-aria/utils';
import React, { FC } from 'react';
import { IButtonRegistry } from 'react-elegant-ui/esm/components/Button/Button.registry';
import {
	IButtonProps as IButtonPropsDefault,
	cnButton,
} from 'react-elegant-ui/esm/components/Button/Button';
import { Defaultize } from 'react-elegant-ui/esm/types/utility-types';

import './Button.css';

export * from 'react-elegant-ui/esm/components/Button/Button';

export const defaultProps = {
	as: 'button' as const,
};

export interface IButtonProps extends IButtonPropsDefault {
	preventFocusOnPress?: boolean;
}

type DefaultProps = keyof typeof defaultProps;
type ButtonProps = Defaultize<IButtonProps, DefaultProps>;

/**
 * This is library implementation of button, but with fix for prevent focus
 */
export const Button: FC<IButtonProps> = (({
	as,
	disabled,
	raw,
	icon,
	iconLeft,
	iconRight,
	children,
	innerRef,
	className,
	addonBefore,
	addonAfter,
	onPress,
	onPressChange,
	onPressStart,
	onPressEnd,
	onPressUp,
	preventFocusOnPress,
	...props
}: ButtonProps) => {
	const { isPressed, pressProps } = usePress({
		isDisabled: disabled,
		onPress,
		onPressChange,
		onPressStart,
		onPressEnd,
		onPressUp,
		preventFocusOnPress,
	});

	const iconLeftOrIcon = iconLeft || icon;

	// insert innerRef back when `as` is component type
	if (typeof as !== 'string') {
		(props as IButtonProps).innerRef = innerRef;
	}

	const Component = as;
	const propsMix = mergeProps(props, pressProps);

	const { Content, Text, Icon } = useComponentRegistry<IButtonRegistry>(cnButton());

	return (
		<Component
			ref={typeof as === 'string' ? innerRef : undefined}
			{...propsMix}
			className={cnButton({ pressed: isPressed, disabled, raw }, [className])}
			disabled={disabled}
			aria-disabled={disabled}
		>
			{addonBefore}
			{raw ? (
				children
			) : (
				<Content>
					{iconLeftOrIcon && <Icon provider={iconLeftOrIcon} side="left" />}
					{!children ? undefined : <Text>{children}</Text>}
					{iconRight && <Icon provider={iconRight} side="right" />}
				</Content>
			)}
			{addonAfter}
		</Component>
	);
}) as FC<IButtonProps>;

Button.displayName = cnButton();
Button.defaultProps = defaultProps;
