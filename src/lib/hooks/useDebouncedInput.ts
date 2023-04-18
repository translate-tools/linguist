import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

export const useDebouncedInput = (initValue = '') => {
	const [value, setValue] = useState(initValue);
	const [debouncedValue, debounceController] = useDebounce(value, 500);

	// Immediately flush for empty input
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
