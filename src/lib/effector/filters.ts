import { isEqual } from 'lodash';

export const isNotEqual = <X, Y>(update: X, state: Y) => !isEqual(update, state);
