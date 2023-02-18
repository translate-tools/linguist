import React, { FC } from 'react';
import { ITranslation } from '../../../types/translation/Translation';
import { Button } from '../../primitives/Button/Button.bundle/universal';
import { getMessage } from '../../../lib/language';
import { Icon } from '../../primitives/Icon/Icon.bundle/desktop';
import { useTranslateFavorite } from './useTranslateFavorite';

export const BookmarksButton: FC<{ translation: ITranslation | null }> = ({
	translation,
}) => {
	const { isFavorite, toggleFavorite } = useTranslateFavorite(translation);

	return (
		<Button
			view="clear"
			size="s"
			content="icon"
			onPress={toggleFavorite}
			title={getMessage(
				isFavorite ? 'bookmarkButton_delete' : 'bookmarkButton_add',
			)}
			disabled={translation === null}
		>
			<Icon glyph={isFavorite ? 'bookmark' : 'bookmark-border'} scalable={false} />
		</Button>
	);
};
