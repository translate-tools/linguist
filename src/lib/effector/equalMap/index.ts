import { Store } from 'effector';

import { createSelector } from '../createSelector';
import { isNotEqual } from '../filters';

/**
 * Return derived store with mapped data from source store.
 * Derived store will filter updates that equal to a current state (will used deep equality check)
 */
export function equalMap<Type, MappedData>(
	source: Store<Type>,
	selector: (value: Type) => MappedData,
): Store<MappedData> {
	return createSelector(source, selector, { updateFilter: isNotEqual });
}
