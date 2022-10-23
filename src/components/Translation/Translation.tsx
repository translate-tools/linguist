import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

import { ITranslation } from '../../types/translation/Translation';
import { isMobileBrowser } from '../../lib/browser';
import { getLanguageNameByCode } from '../../lib/language';

import { Button } from '../Button/Button.bundle/desktop';
import { Icon } from '../Icon/Icon.bundle/desktop';

import './Translation.css';

export const cnTranslation = cn('Translation');

export type TranslationEntryProps = {
	translation: ITranslation;
	timestamp?: number;
	onPressTTS: (target: 'original' | 'translation') => void;
	controlPanelSlot?: ReactNode | ReactNode[];
	headStartSlot?: ReactNode | ReactNode[];
};

// TODO: implement text highlighting for search results
export const Translation: FC<TranslationEntryProps> = ({
	translation,
	timestamp,
	onPressTTS,
	controlPanelSlot,
	headStartSlot,
}) => {
	// TODO: make option to choose translation layout direction
	const layout = isMobileBrowser() ? 'vertical' : 'horizontal';

	return (
		<div className={cnTranslation({ layout })}>
			<div className={cnTranslation('Head')}>
				<div className={cnTranslation('Meta')}>
					{headStartSlot}
					{timestamp && (
						<span className={cnTranslation('Date')}>
							{new Date(timestamp).toLocaleDateString()}
						</span>
					)}
				</div>
				<div className={cnTranslation('Control')}>{controlPanelSlot}</div>
			</div>
			<div className={cnTranslation('Content')}>
				<div className={cnTranslation('TextContainer')}>
					<div className={cnTranslation('TextAction')}>
						<Button
							onPress={() => {
								onPressTTS('original');
							}}
							view="clear"
							size="s"
						>
							<Icon glyph="volume-up" scalable={false} />
						</Button>

						<span className={cnTranslation('Lang')}>
							{getLanguageNameByCode(translation.from)}
						</span>
					</div>
					<div className={cnTranslation('Text')}>
						{translation.originalText}
					</div>
				</div>
				<div className={cnTranslation('TextContainer')}>
					<div className={cnTranslation('TextAction')}>
						<Button
							onPress={() => {
								onPressTTS('translation');
							}}
							view="clear"
							size="s"
						>
							<Icon glyph="volume-up" scalable={false} />
						</Button>

						<span className={cnTranslation('Lang')}>
							{getLanguageNameByCode(translation.to)}
						</span>
					</div>
					<div className={cnTranslation('Text')}>
						{translation.translatedText}
					</div>
				</div>
			</div>
		</div>
	);
};
