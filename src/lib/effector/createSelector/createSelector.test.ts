import { createEvent, createStore } from 'effector';
import { isEqual } from 'lodash';
import { reshape } from 'patronum';

import { createSelector } from '.';

type UpdateData = Partial<{
	foo: {
		x: number;
	};
	bar: {
		x: number;
	};
	baz: {
		x: number;
	};
}>;

describe('demonstrate reshape problems', () => {
	test("reshape call watch when target didn't updated", () => {
		const $store1 = createStore({
			foo: { x: 1 },
			bar: { x: 2 },
			baz: { x: 3 },
		});

		const updated = createEvent<UpdateData>();

		$store1.on(updated, (state, payload) => ({ ...state, ...payload }));

		const { $subStore } = reshape({
			source: $store1,
			shape: {
				$subStore: ({ foo, bar }) => ({ foo, bar }),
			},
		});

		const watcher = jest.fn();
		$subStore.watch(watcher);

		updated({ baz: { x: 42 } });

		// Calls 2 times even when selected data did not changed
		expect(watcher).toBeCalledTimes(2);
	});

	test("createSelector doesn't trigger watch for not target updates", () => {
		const $store1 = createStore({
			foo: { x: 1 },
			bar: { x: 2 },
			baz: { x: 3 },
		});

		const updated = createEvent<UpdateData>();

		$store1.on(updated, (state, payload) => ({ ...state, ...payload }));

		const $subStore = createSelector($store1, ({ foo, bar }) => ({ foo, bar }), {
			updateFilter: (update, state) => !isEqual(update, state),
		});

		const watcher = jest.fn();
		$subStore.watch(watcher);

		updated({ baz: { x: 42 } });
		expect(watcher).toBeCalledTimes(1);

		updated({ bar: { x: 42 } });
		expect(watcher).toBeCalledTimes(2);
	});
});
