import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/auto_fix_high.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphAutoFixProps {
	glyph?: 'autoFix';
}

export const withGlyphAutoFix = IconConstructor<IIconGlyphAutoFixProps>(
	'autoFix',
	IconElement,
);
