export * from 'react-elegant-ui/esm/components/Select/Select.registry/desktop';

import { Registry } from 'react-elegant-ui/esm/lib/di';

import { cnSelect } from 'react-elegant-ui/esm/components/Select/Select';
import { withDefaultProps } from 'react-elegant-ui/esm/hocs/withDefaultProps';
import { applyMinWidth } from 'react-elegant-ui/esm/hooks/behavior/usePopper/modifiers/applyMinWidth';
import { applyMaxHeight } from '../applyMaxHeight';
import { regObjects as regObjectsBasic } from 'react-elegant-ui/esm/components/Select/Select.registry/desktop';

import { Popup } from 'react-elegant-ui/esm/components/Popup/Popup.bundle/desktop';

export const regObjects: typeof regObjectsBasic = {
	...regObjectsBasic, // Desktop features
	PopupComponent: withDefaultProps(Popup, {
		// at the moment `applyMaxHeight` decrease block size while scroll, it's bug
		modifiers: [
			applyMaxHeight,
			applyMinWidth,
			{ name: applyMaxHeight.name, options: { maxHeight: 200 } },
		],
		view: 'default',
	}),
};

export const SelectDesktopRegistry = new Registry({ id: cnSelect() }).fill(
	regObjects as any,
);
