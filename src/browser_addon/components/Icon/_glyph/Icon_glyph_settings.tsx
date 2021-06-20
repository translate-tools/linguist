import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';
import IconElement from '../Icon.assets/Material/settings.svg';

export interface IIconGlyphSettingsProps {
	glyph?: 'settings';
}

export const withGlyphSettings = IconConstructor<IIconGlyphSettingsProps>(
	'settings',
	IconElement,
);
