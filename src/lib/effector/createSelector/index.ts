import { createStore, Store } from 'effector';

// TODO: research behavior of null/undefined returned values, fix types and add tests
/**
 * Return derived store with mapped data from source store
 *
 * You may control when store will update
 */
export function createSelector<Type, MappedData>(
	source: Store<Type>,
	selector: (value: Type) => MappedData,
	options?: { updateFilter: (payload: MappedData, state: Type) => boolean },
): Store<MappedData> {
	const { updateFilter } = options || {};

	const mappedStore = source.map((state) => {
		const result = selector(state);
		return result === undefined ? null : result;
	});

	const store = createStore(mappedStore.getState());
	store.on(mappedStore, (state, updatedState) => {
		const shouldUpdate =
			updateFilter !== undefined
				? updateFilter(updatedState as MappedData, state as Type)
				: updatedState !== state;
		return shouldUpdate ? updatedState : undefined;
	});

	// Return derived store to prevent mutate
	const derivedStore = store.map((state) => state);
	return derivedStore as Store<MappedData>;
}
