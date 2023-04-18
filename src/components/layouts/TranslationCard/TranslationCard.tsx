import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

import { isMobileBrowser } from '../../../lib/browser';
import { getLanguageNameByCode } from '../../../lib/language';
import { ITranslation } from '../../../types/translation/Translation';
import { Button } from '../../primitives/Button/Button.bundle/desktop';
import { Icon } from '../../primitives/Icon/Icon.bundle/desktop';

import './TranslationCard.css';

export const cnTranslationCard = cn('TranslationCard');

export type TranslationCardProps = {
	translation: ITranslation;
	timestamp?: number;
	onPressTTS: (target: 'original' | 'translation') => void;
	controlPanelSlot?: ReactNode | ReactNode[];
	headStartSlot?: ReactNode | ReactNode[];
};

// TODO: implement text highlighting for search results
/**
 * Represent translation data
 */
export const TranslationCard: FC<TranslationCardProps> = ({
	translation,
	timestamp,
	onPressTTS,
	controlPanelSlot,
	headStartSlot,
}) => {
	// TODO: make option to choose translation layout direction
	const layout = isMobileBrowser() ? 'vertical' : 'horizontal';

	return (
		<div className={cnTranslationCard({ layout })}>
			<div className={cnTranslationCard('Head')}>
				<div className={cnTranslationCard('Meta')}>
					{headStartSlot}
					{timestamp && (
						<span className={cnTranslationCard('Date')}>
							{new Date(timestamp).toLocaleDateString()}
						</span>
					)}
				</div>
				<div className={cnTranslationCard('Control')}>{controlPanelSlot}</div>
			</div>
			<div className={cnTranslationCard('Content')}>
				<div className={cnTranslationCard('TextContainer')}>
					<div className={cnTranslationCard('TextAction')}>
						<Button
							onPress={() => {
								onPressTTS('original');
							}}
							view="clear"
							size="s"
						>
							<Icon glyph="volume-up" scalable={false} />
						</Button>

						<span className={cnTranslationCard('Lang')}>
							{getLanguageNameByCode(translation.from)}
						</span>
					</div>
					<div className={cnTranslationCard('Text')}>
						{translation.originalText}
					</div>
				</div>
				<div className={cnTranslationCard('TextContainer')}>
					<div className={cnTranslationCard('TextAction')}>
						<Button
							onPress={() => {
								onPressTTS('translation');
							}}
							view="clear"
							size="s"
						>
							<Icon glyph="volume-up" scalable={false} />
						</Button>

						<span className={cnTranslationCard('Lang')}>
							{getLanguageNameByCode(translation.to)}
						</span>
					</div>
					<div className={cnTranslationCard('Text')}>
						{translation.translatedText}
					</div>
				</div>
			</div>
		</div>
	);
};
