export * from 'react-elegant-ui/esm/components/Select/Select.registry/desktop';

import { Popup } from 'react-elegant-ui/esm/components/Popup/Popup.bundle/desktop';
import { cnSelect } from 'react-elegant-ui/esm/components/Select/Select';
import {
	ISelectDesktopRegistry,
	regObjects as regObjectsBasic,
} from 'react-elegant-ui/esm/components/Select/Select.registry/desktop';
import { withDefaultProps } from 'react-elegant-ui/esm/hocs/withDefaultProps';
import { applyMinWidth } from 'react-elegant-ui/esm/hooks/behavior/usePopper/modifiers/applyMinWidth';
import { Registry } from 'react-elegant-ui/esm/lib/di';

import { applyMaxHeight } from '../applyMaxHeight';

export const regObjects: ISelectDesktopRegistry = {
	...regObjectsBasic, // Desktop features
	// FIXME: remove cast when bug will fixed https://github.com/vitonsky/react-elegant-ui/issues/253
	PopupComponent: withDefaultProps(Popup, {
		// at the moment `applyMaxHeight` decrease block size while scroll, it's bug
		modifiers: [
			applyMaxHeight,
			applyMinWidth,
			{ name: applyMaxHeight.name, options: { maxHeight: 200 } },
		],
		view: 'default',
	}) as ISelectDesktopRegistry['PopupComponent'],
};

export const SelectDesktopRegistry = new Registry({ id: cnSelect() }).fill(
	regObjects as any,
);
