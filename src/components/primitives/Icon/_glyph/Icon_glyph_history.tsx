import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Material/history.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphHistoryProps {
	glyph?: 'history';
}

export const withGlyphHistory = IconConstructor<IIconGlyphHistoryProps>(
	'history',
	IconElement,
);
