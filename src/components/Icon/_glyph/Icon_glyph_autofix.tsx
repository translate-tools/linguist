import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';
import IconElement from '../Icon.assets/Material/auto_fix_high.svg';

export interface IIconGlyphAutoFixProps {
	glyph?: 'autoFix';
}

export const withGlyphAutoFix = IconConstructor<IIconGlyphAutoFixProps>(
	'autoFix',
	IconElement,
);
