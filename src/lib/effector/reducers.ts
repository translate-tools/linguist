import { isEqual } from 'lodash';

/**
 * Update only not equal object properties
 */
export const updateNotEqualProps = <T extends Record<string, unknown>>(
	state: T,
	data: T,
) => {
	const newState = { ...state };

	// Update props
	for (const key in data) {
		const isEqualValue = isEqual(state[key as keyof T], data[key as keyof T]);
		if (!isEqualValue) {
			newState[key as keyof T] = data[key as keyof T];
		}
	}

	return newState;
};
