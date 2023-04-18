import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/bookmark.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphBookmarkProps {
	glyph?: 'bookmark';
}

export const withGlyphBookmark = IconConstructor<IIconGlyphBookmarkProps>(
	'bookmark',
	IconElement,
);
