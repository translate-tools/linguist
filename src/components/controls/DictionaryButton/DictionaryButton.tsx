import React, { FC } from 'react';

import { getMessage } from '../../../lib/language';
import { ITranslation } from '../../../types/translation/Translation';
import { Button } from '../../primitives/Button/Button.bundle/universal';
import { Icon } from '../../primitives/Icon/Icon.bundle/desktop';

import { useDictionary } from './useDictionary';

export const DictionaryButton: FC<{ translation: ITranslation | null }> = ({
	translation,
}) => {
	const dictionary = useDictionary(translation);
	return (
		<Button
			view="clear"
			size="s"
			content="icon"
			onPress={dictionary.toggle}
			title={getMessage(
				dictionary.has ? 'dictionaryButton_delete' : 'dictionaryButton_add',
			)}
			disabled={translation === null}
		>
			<Icon
				glyph={dictionary.has ? 'bookmark' : 'bookmark-border'}
				scalable={false}
			/>
		</Button>
	);
};
