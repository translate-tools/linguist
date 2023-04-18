import { withModButtonPressAnimation } from 'react-elegant-ui/esm/components/Button/_pressAnimation/Button_pressAnimation';
import { withModButtonSizeL } from 'react-elegant-ui/esm/components/Button/_size/Button_size_l';
import { withModButtonSizeM } from 'react-elegant-ui/esm/components/Button/_size/Button_size_m';
import { withModButtonSizeS } from 'react-elegant-ui/esm/components/Button/_size/Button_size_s';
import { withModButtonTypeLink } from 'react-elegant-ui/esm/components/Button/_type/Button_type_link';
import { withModButtonViewAction } from 'react-elegant-ui/esm/components/Button/_view/Button_view_action';
import { withModButtonViewClear } from 'react-elegant-ui/esm/components/Button/_view/Button_view_clear';
import { withModButtonViewDefault } from 'react-elegant-ui/esm/components/Button/_view/Button_view_default';
import { withModButtonViewPseudo } from 'react-elegant-ui/esm/components/Button/_view/Button_view_pseudo';
import { withModButtonWidthMax } from 'react-elegant-ui/esm/components/Button/_width/Button_width_max';
import { cnButton } from 'react-elegant-ui/esm/components/Button/Button';
import { ButtonDesktopRegistry } from 'react-elegant-ui/esm/components/Button/Button.registry/desktop';
import { withFocusVisible } from 'react-elegant-ui/esm/hocs/withFocusVisible';
import { compose, composeU, ExtractProps } from 'react-elegant-ui/esm/lib/compose';
import { withRegistry } from 'react-elegant-ui/esm/lib/di';

import { withModButtonContentIcon } from '../_content/Button_content_icon';
import { Button as PatchedButton } from '../Button';

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
