import React, { FC } from 'react';
import { Button } from '../Button/Button.bundle/desktop';
import { Select } from '../Select/Select.bundle/desktop';
import { Icon } from '../Icon/Icon.bundle/desktop';
import { cn } from '@bem-react/classname';

import './LanguagePanel.css';
import { getMessage } from '../../lib/language';

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
			content: getMessage(`langCode_${value}`),
		}))
		.sort(({ content: a }, { content: b }) => (a > b ? 1 : a < b ? -1 : 0));

	const optionsFrom = auto
		? [{ id: 'auto', content: getMessage('lang_detect') }, ...options]
		: options;

	return (
		<span className={cnLanguagePanel()}>
			<Select
				options={optionsFrom}
				value={fromValue}
				setValue={(value) =>
					typeof value === 'string' && setFrom !== undefined && setFrom(value)
				}
			/>
			<Button
				view="default"
				onPress={swapLanguages}
				disabled={fromValue === 'auto' || fromValue === toValue || disableSwap}
				title={getMessage('lang_swap')}
				content="icon"
			>
				<Icon glyph="swap-horiz" scalable={false} />
			</Button>
			<Select
				options={options}
				value={toValue}
				setValue={(value) =>
					typeof value === 'string' && setTo !== undefined && setTo(value)
				}
			/>
		</span>
	);
};
