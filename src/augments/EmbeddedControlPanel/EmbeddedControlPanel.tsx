import React, { FC } from 'react';
import { cn } from '@bem-react/classname';
import { cnTheme } from 'react-elegant-ui/esm/theme';

import './EmbeddedControlPanel.css';

import { theme } from '../../themes/presets/default/desktop';
import { Button } from '../../components/primitives/Button/Button.bundle/desktop';

import LogoElement from '../../res/logo-base.svg';

export const cnEmbeddedControlPanel = cn('EmbeddedControlPanel');

// TODO: implement logic as well as in main popup
export const EmbeddedControlPanel: FC = () => {
	return (
		<div className={cnEmbeddedControlPanel(null, [cnTheme(theme)])}>
			<div className={cnEmbeddedControlPanel('Logo')}>
				<LogoElement className={cnEmbeddedControlPanel('LogoImage')} />
			</div>

			<div className={cnEmbeddedControlPanel('Controls')}>
				<Button view="action">Translate page</Button>
			</div>
		</div>
	);
};
