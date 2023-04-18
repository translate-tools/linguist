import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/swap_horiz.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphSwapHorizProps {
	glyph?: 'swap-horiz';
}

export const withGlyphSwapHoriz = IconConstructor<IIconGlyphSwapHorizProps>(
	'swap-horiz',
	IconElement,
);
