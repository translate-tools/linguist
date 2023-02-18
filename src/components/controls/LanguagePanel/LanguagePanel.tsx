import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { getLanguageNameByCode, getMessage } from '../../../lib/language';

import { Button } from '../../primitives/Button/Button.bundle/desktop';
import { Select } from '../../primitives/Select/Select.bundle/desktop';
import { Icon } from '../../primitives/Icon/Icon.bundle/desktop';

import './LanguagePanel.css';

export const cnLanguagePanel = cn('LanguagePanel');

export interface LanguagePanelProps {
	languages: string[];
	from?: string;
	to?: string;
	auto?: boolean;
	setFrom?: (value?: string) => void;
	setTo?: (value?: string) => void;
	swapHandler?: (languages: { from: string; to: string }) => void;
	disableSwap?: boolean;
	preventFocusOnPress?: boolean;
	mobile?: boolean;
}

export const LanguagePanel: FC<LanguagePanelProps> = ({
	auto,
	languages,
	from,
	to,
	setFrom,
	setTo,
	swapHandler,
	disableSwap,
	preventFocusOnPress,
	mobile,
}) => {
	const fromValue = from !== undefined ? from : auto ? 'auto' : languages[0];
	const toValue = to !== undefined ? to : languages[0];

	const swapLanguages = () => {
		if (fromValue === 'auto') return;

		if (swapHandler !== undefined) {
			swapHandler({ from: toValue, to: fromValue });
			return;
		}

		if (setFrom !== undefined && setTo !== undefined) {
			setFrom(toValue);
			setTo(fromValue);
		}
	};

	const options = languages
		.map((value) => ({
			id: value,
			content: getLanguageNameByCode(value),
		}))
		.sort(({ content: a }, { content: b }) => (a > b ? 1 : a < b ? -1 : 0));

	const optionsFrom = auto
		? [{ id: 'auto', content: getLanguageNameByCode('auto') }, ...options]
		: options;

	return (
		<span className={cnLanguagePanel({ view: mobile ? 'wide' : undefined })}>
			<Select
				options={optionsFrom}
				value={fromValue}
				setValue={(value) =>
					typeof value === 'string' && setFrom !== undefined && setFrom(value)
				}
				className={cnLanguagePanel('Select')}
			/>
			<Button
				view="default"
				onPress={swapLanguages}
				disabled={fromValue === 'auto' || fromValue === toValue || disableSwap}
				title={getMessage('lang_swap')}
				content="icon"
				preventFocusOnPress={preventFocusOnPress}
				className={cnLanguagePanel('Button')}
				size={mobile ? 'l' : 'm'}
			>
				<Icon glyph="swap-horiz" scalable={false} />
			</Button>
			<Select
				options={options}
				value={toValue}
				setValue={(value) =>
					typeof value === 'string' && setTo !== undefined && setTo(value)
				}
				className={cnLanguagePanel('Select')}
			/>
		</span>
	);
};
