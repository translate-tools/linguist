import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

export const useDebouncedInput = (initValue = '') => {
	const [value, setValue] = useState(initValue);
	const [debouncedValue, debounceController] = useDebounce(value, 500);
	useEffect(() => {
		if (value === '') {
			debounceController.flush();
		}
	}, [value, debounceController]);

	return {
		value,
		setValue,
		debouncedValue,
	} as const;
};
