import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/content_copy.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphContentCopyProps {
	glyph?: 'content-copy';
}

export const withGlyphContentCopy = IconConstructor<IIconGlyphContentCopyProps>(
	'content-copy',
	IconElement,
);
