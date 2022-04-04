// import { compose, composeU, ExtractProps } from '@bem-react/core';
import { compose, composeU, ExtractProps } from 'react-elegant-ui/esm/lib/compose';
import { Icon as BaseIcon } from 'react-elegant-ui/esm/components/Icon/Icon';

import { withModIconGlyphUnfoldMore } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_unfold-more';
import { withModIconGlyphExpandMore } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_expand-more';
import { withModIconGlyphClose } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_close';
import { withModIconGlyphCheck } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_check';
import { withModIconGlyphCancel } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_cancel';
import { withModIconSizeM } from 'react-elegant-ui/esm/components/Icon/_size/Icon_size_m';
import { withModIconSizeS } from 'react-elegant-ui/esm/components/Icon/_size/Icon_size_s';

import { withGlyphSwapHoriz } from '../_glyph/Icon_glyph_swap-horiz';
import { withGlyphSettings } from '../_glyph/Icon_glyph_settings';
import { withGlyphDictionary } from '../_glyph/Icon_glyph_dictionary';
import { withGlyphDelete } from '../_glyph/Icon_glyph_delete';
import { withGlyphVolumeUp } from '../_glyph/Icon_glyph_volume-up';
import { withGlyphAutoFix } from '../_glyph/Icon_glyph_autofix';

export const Icon = compose(
	composeU(
		withGlyphSettings,
		withGlyphSwapHoriz,
		withGlyphDictionary,
		withGlyphDelete,
		withGlyphVolumeUp,
		withGlyphAutoFix,

		withModIconGlyphUnfoldMore,
		withModIconGlyphExpandMore,
		withModIconGlyphClose,
		withModIconGlyphCheck,
		withModIconGlyphCancel,
	),

	composeU(withModIconSizeM, withModIconSizeS),
)(BaseIcon);

Icon.defaultProps = {
	size: 'm',
	scalable: true,
};

export type IIconProps = ExtractProps<typeof Icon>;
