import { compose, composeU, ExtractProps } from 'react-elegant-ui/esm/lib/compose';
import { withRegistry } from 'react-elegant-ui/esm/lib/di';

import { Button as PatchedButton } from '../Button';

import { ButtonDesktopRegistry } from 'react-elegant-ui/esm/components/Button/Button.registry/desktop';
import { withFocusVisible } from 'react-elegant-ui/esm/hocs/withFocusVisible';

import { withModButtonViewDefault } from 'react-elegant-ui/esm/components/Button/_view/Button_view_default';
import { withModButtonViewClear } from 'react-elegant-ui/esm/components/Button/_view/Button_view_clear';
import { withModButtonViewAction } from 'react-elegant-ui/esm/components/Button/_view/Button_view_action';
import { withModButtonViewPseudo } from 'react-elegant-ui/esm/components/Button/_view/Button_view_pseudo';

import { withModButtonSizeS } from 'react-elegant-ui/esm/components/Button/_size/Button_size_s';
import { withModButtonSizeM } from 'react-elegant-ui/esm/components/Button/_size/Button_size_m';
import { withModButtonSizeL } from 'react-elegant-ui/esm/components/Button/_size/Button_size_l';
import { withModButtonWidthMax } from 'react-elegant-ui/esm/components/Button/_width/Button_width_max';

import { withModButtonPressAnimation } from 'react-elegant-ui/esm/components/Button/_pressAnimation/Button_pressAnimation';

import { withModButtonTypeLink } from 'react-elegant-ui/esm/components/Button/_type/Button_type_link';

import { withModButtonContentIcon } from '../_content/Button_content_icon';
import { cnButton } from 'react-elegant-ui/esm/components/Button/Button';

export * from '../Button';

const DesktopButton = withFocusVisible(cnButton())(PatchedButton);

export const Button = compose(
	withRegistry(ButtonDesktopRegistry),
	composeU(
		withModButtonViewDefault,
		withModButtonViewClear,
		withModButtonViewAction,
		withModButtonViewPseudo,
	),
	composeU(withModButtonSizeS, withModButtonSizeM, withModButtonSizeL),
	composeU(withModButtonTypeLink),
	composeU(withModButtonContentIcon),
	composeU(withModButtonWidthMax),
	withModButtonPressAnimation,
)(DesktopButton);

Button.defaultProps = {
	view: 'default',
	pressAnimation: true,
	size: 'm',
};

export type IButtonProps = ExtractProps<typeof Button>;
