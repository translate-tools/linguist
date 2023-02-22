import { isEqual } from 'lodash';

export const updateNotEqualFilter = <X, Y>(update: X, state: Y) =>
	!isEqual(update, state);
