// Imported from yandex-ui. Source: https://github.com/bem/yandex-ui/

import getBasePlacement from 'react-elegant-ui/esm/hooks/behavior/usePopper/utils';
import { detectOverflow, Modifier, ModifierArguments } from '@popperjs/core';

export type ApplyMaxHeightOptions = {
	/**
	 * User defined height limit
	 */
	maxHeight?: number;
	/**
	 * Indent from viewport edge
	 *
	 * @default 16
	 */
	padding?: number;
};

// TODO: #bug this mod can decrease height when we have free space
// probably we should apply different strategies to calc this depends of placement (x or y direction)
function applyMaxHeightFn({ state, options }: ModifierArguments<ApplyMaxHeightOptions>) {
	const { maxHeight: userMaxHeight, padding = 16 } = options;

	const overflow = detectOverflow(state, { padding });
	const { y = 0 } = state.modifiersData.preventOverflow || {};
	const { height } = state.rects.popper;
	const basePlacement = getBasePlacement(state.placement);

	const heightProp = basePlacement === 'top' ? 'top' : 'bottom';
	const maxHeight = height - overflow[heightProp] - y;
	const popupMaxHeight = userMaxHeight
		? Math.max(maxHeight - y, userMaxHeight)
		: maxHeight;

	state.styles.popper = {
		...state.styles.popper,
		maxHeight: `${popupMaxHeight}px`,
	};
}

/**
 * Modifier to set optimal height of popup within viewport
 */
export const applyMaxHeight: Modifier<'applyMaxHeight', ApplyMaxHeightOptions> = {
	name: 'applyMaxHeight',
	enabled: true,
	fn: applyMaxHeightFn,
	phase: 'main',
	requires: ['computeStyles'],
};
