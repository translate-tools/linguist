import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/bookmark_border.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphBookmarkBorderProps {
	glyph?: 'bookmark-border';
}

export const withGlyphBookmarkBorder = IconConstructor<IIconGlyphBookmarkBorderProps>(
	'bookmark-border',
	IconElement,
);
