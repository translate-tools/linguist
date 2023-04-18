import { IconConstructor } from 'react-elegant-ui/esm/components/Icon/Icon.utils/IconConstructor';

import IconElement from '../Icon.assets/Font-Awesome/dictionary.svg';

import 'react-elegant-ui/esm/components/Icon/_glyph/Icon_hasGlyph.css';

export interface IIconGlyphDictionaryProps {
	glyph?: 'dictionary';
}

export const withGlyphDictionary = IconConstructor<IIconGlyphDictionaryProps>(
	'dictionary',
	IconElement,
);
