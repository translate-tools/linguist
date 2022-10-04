import React, { FC, ReactNode } from 'react';
import { cn } from '@bem-react/classname';

import { ITranslation } from '../../types/translation/Translation';
import { isMobileBrowser } from '../../lib/browser';
import { getLanguageNameByCode, getMessage } from '../../lib/language';

import { Button } from '../Button/Button.bundle/desktop';
import { Icon } from '../Icon/Icon.bundle/desktop';

import './Translation.css';

export const cnTranslation = cn('Translation');

export type TranslationEntryProps = {
	translation: ITranslation;
	timestamp?: number;
	onPressRemove?: () => void;
	onPressTTS: (target: 'original' | 'translation') => void;
	controlPanelSlot?: ReactNode | ReactNode[];
	headStartSlot?: ReactNode | ReactNode[];
};

export const Translation: FC<TranslationEntryProps> = ({
	translation,
	timestamp,
	onPressRemove,
	onPressTTS,
	controlPanelSlot,
	headStartSlot,
}) => {
	const { from, to, text, translate } = translation;

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
				<div className={cnTranslation('Control')}>
					{controlPanelSlot}
					{/* TODO: insert remove button in use place */}
					{onPressRemove && (
						<Button
							view="clear"
							size="s"
							onPress={onPressRemove}
							title={getMessage('common_action_removeFromDictionary')}
							content="icon"
						>
							<Icon glyph="delete" scalable={false} />
						</Button>
					)}
				</div>
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
							{getLanguageNameByCode(from)}
						</span>
					</div>
					<div className={cnTranslation('Text')}>{text}</div>
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
							{getLanguageNameByCode(to)}
						</span>
					</div>
					<div className={cnTranslation('Text')}>{translate}</div>
				</div>
			</div>
		</div>
	);
};
