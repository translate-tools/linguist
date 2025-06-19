'use client';
import React from 'react';

import fgioptions from './fgioptions_soft.json';

export const Hsciifontpicker = () => {
	const handlefitemchange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		if (event.target.value) {
			document.body.style.fontFamily = event.target.value;
		}
	};
	return (
		<div>
			<select onChange={handlefitemchange} defaultValue={''}>
				<option value="" disabled>
					hscii_font select please
				</option>
				{fgioptions.map((option) => (
					<option key={option.walue} value={option.walue}>
						{' '}
						{option.label}{' '}
					</option>
				))}
			</select>
		</div>
	);
};
