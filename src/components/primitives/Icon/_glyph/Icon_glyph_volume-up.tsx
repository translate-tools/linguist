import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/volume_up.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphVolumeUpProps {
	glyph?: 'volume-up';
}

export const withGlyphVolumeUp = IconConstructor<IIconGlyphVolumeUpProps>(
	'volume-up',
	IconElement,
);
