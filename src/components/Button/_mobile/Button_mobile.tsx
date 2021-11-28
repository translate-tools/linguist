import React, { useMemo } from 'react';
import { withClassnameHOC, withHOCConstructor } from 'react-elegant-ui/esm/lib/compose';

import { cnButton, IButtonProps } from '../Button';
import { isSmartphone } from '../../../lib/browser';

import './Button_mobile.css';

export interface ModButtonMobile {
	mobile?: true;
}

export const withModButtonMobile = withClassnameHOC<ModButtonMobile>(cnButton(), {
	mobile: true,
});

export const withButtonMobile = withHOCConstructor<{}, IButtonProps>({}, (Component) => {
	const WrappedComponent = withModButtonMobile(Component);

	return ({ className, ...props }) => {
		const isMobile = useMemo(() => isSmartphone(), []);

		return (
			<WrappedComponent
				{...props}
				className={cnButton({ mobile: isMobile }, [className])}
			/>
		);
	};
});
