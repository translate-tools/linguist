// import { compose, composeU, ExtractProps } from '@bem-react/core';
import { withModIconGlyphCancel } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_cancel';
import { withModIconGlyphCheck } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_check';
import { withModIconGlyphClose } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_close';
import { withModIconGlyphExpandMore } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_expand-more';
import { withModIconGlyphUnfoldMore } from 'react-elegant-ui/esm/components/Icon/_glyph/Icon_glyph_unfold-more';
import { withModIconSizeM } from 'react-elegant-ui/esm/components/Icon/_size/Icon_size_m';
import { withModIconSizeS } from 'react-elegant-ui/esm/components/Icon/_size/Icon_size_s';
import { Icon as BaseIcon } from 'react-elegant-ui/esm/components/Icon/Icon';
import { compose, composeU, ExtractProps } from 'react-elegant-ui/esm/lib/compose';

import { withGlyphAutoFix } from '../_glyph/Icon_glyph_autofix';
import { withGlyphBookmark } from '../_glyph/Icon_glyph_bookmark';
import { withGlyphBookmarkBorder } from '../_glyph/Icon_glyph_bookmark-border';
import { withGlyphDelete } from '../_glyph/Icon_glyph_delete';
import { withGlyphDictionary } from '../_glyph/Icon_glyph_dictionary';
import { withGlyphHistory } from '../_glyph/Icon_glyph_history';
import { withGlyphSettings } from '../_glyph/Icon_glyph_settings';
import { withGlyphSwapHoriz } from '../_glyph/Icon_glyph_swap-horiz';
import { withGlyphVolumeUp } from '../_glyph/Icon_glyph_volume-up';

export const Icon = compose(
	composeU(
		withGlyphSettings,
		withGlyphSwapHoriz,
		withGlyphDictionary,
		withGlyphDelete,
		withGlyphVolumeUp,
		withGlyphAutoFix,
		withGlyphBookmark,
		withGlyphBookmarkBorder,
		withGlyphHistory,

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
