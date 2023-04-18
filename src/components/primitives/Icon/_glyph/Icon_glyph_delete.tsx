import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/delete.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphDeleteProps {
	glyph?: 'delete';
}

export const withGlyphDelete = IconConstructor<IIconGlyphDeleteProps>(
	'delete',
	IconElement,
);
